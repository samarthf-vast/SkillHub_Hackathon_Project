import { getClient } from "./ai";
import { prisma } from "./db";
import type { SearchResult, PendingSearchResult, EmployeeWithDetails, ExtractedProfile } from "@/types";

async function getAllEmployeesWithDetails(): Promise<EmployeeWithDetails[]> {
  const employees = await prisma.employee.findMany({
    include: {
      skills: { include: { skill: true } },
      projects: true,
      certifications: true,
    },
  });
  return employees as unknown as EmployeeWithDetails[];
}

function buildEmployeeSummary(emp: EmployeeWithDetails): string {
  const skills = emp.skills
    .map((s) => `${s.skill.name} (${s.proficiency}, ${s.yearsExp}yr${s.inferred ? ", inferred" : ""})`)
    .join(", ");

  const projects = emp.projects
    .map((p) => {
      const tech = (() => { try { return JSON.parse(p.techStack).join(", "); } catch { return p.techStack; } })();
      return `${p.name}${p.role ? ` (${p.role})` : ""}: ${p.description ?? ""} [${tech}]`;
    })
    .join(" | ");

  const certs = emp.certifications.map((c) => c.name).join(", ");

  return `
Name: ${emp.name}
Location: ${emp.location ?? "Unknown"}
Designation: ${emp.designation ?? "Unknown"}
Department: ${emp.department ?? "Unknown"}
Currently on project: ${emp.currentProject ?? "Unallocated"}
Bio: ${emp.bio ?? ""}
Skills: ${skills || "None listed"}
Projects: ${projects || "None listed"}
Certifications: ${certs || "None"}
  `.trim();
}

export async function semanticSearchPending(query: string): Promise<PendingSearchResult[]> {
  const pendingProfiles = await prisma.profile.findMany({
    where: { status: "PENDING", extractedData: { not: null } },
    include: { employee: { select: { id: true, name: true, designation: true, location: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (pendingProfiles.length === 0) return [];

  // Deduplicate — one pending profile per employee (most recent)
  const seen = new Set<string>();
  const unique = pendingProfiles.filter((p) => !seen.has(p.employeeId) && seen.add(p.employeeId) !== undefined);

  const summaries = unique.map((p, i) => {
    const data: ExtractedProfile = JSON.parse(p.extractedData ?? "{}");
    const skills = (data.skills ?? []).map((s) => `${s.name} (${s.proficiency}, ${s.yearsExp}yr)`).join(", ");
    const projects = (data.projects ?? []).map((pr) => pr.name).join(", ");
    const certs = (data.certifications ?? []).map((c) => c.name).join(", ");
    return `--- Candidate ${i + 1} (Profile ID: ${p.id}) ---
Name: ${data.name || p.employee.name}
Location: ${data.location || p.employee.location || "Unknown"}
Designation: ${data.designation || p.employee.designation || "Unknown"}
Skills: ${skills || "None"}
Projects: ${projects || "None"}
Certifications: ${certs || "None"}`;
  }).join("\n\n");

  const client = getClient();
  const prompt = `You are an HR talent matcher. Rank these PENDING (not yet approved) candidates against the query.

QUERY: "${query}"

CANDIDATES:
${summaries}

Return ONLY a JSON array (no markdown):
[{ "profileId": "exact id from above", "matchScore": 85, "reasoning": "One sentence citing specific skills/projects" }]

Rules:
- Only include candidates with matchScore >= 20
- Rank by matchScore descending
- Return [] if no candidates match`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const text = (completion.choices[0].message.content ?? "")
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const rankings: Array<{ profileId: string; matchScore: number; reasoning: string }> = JSON.parse(text);
    const profileMap = new Map(unique.map((p) => [p.id, p]));

    return rankings
      .filter((r) => r.matchScore >= 20 && profileMap.has(r.profileId))
      .map((r) => {
        const p = profileMap.get(r.profileId)!;
        const data: ExtractedProfile = JSON.parse(p.extractedData ?? "{}");
        return {
          profileId: p.id,
          employeeId: p.employee.id,
          employeeName: data.name || p.employee.name,
          designation: data.designation || p.employee.designation,
          location: data.location || p.employee.location,
          extractedData: data,
          matchScore: r.matchScore,
          reasoning: r.reasoning,
        };
      });
  } catch {
    return [];
  }
}

export async function semanticSearch(query: string): Promise<SearchResult[]> {
  const employees = await getAllEmployeesWithDetails();
  if (employees.length === 0) return [];

  const summaries = employees
    .map((emp, i) => `--- Candidate ${i + 1} (ID: ${emp.id}) ---\n${buildEmployeeSummary(emp)}`)
    .join("\n\n");

  const client = getClient();

  const prompt = `You are an expert HR talent matcher. Analyze each candidate against the query and return a ranked JSON array.

QUERY: "${query}"

CANDIDATES:
${summaries}

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "employeeId": "the exact id from above",
    "matchScore": 87,
    "reasoning": "One clear sentence citing specific skills and experience that match the query"
  }
]

Rules:
- Only include candidates with matchScore >= 20
- Rank by matchScore descending (highest first)
- matchScore 0-100: skills match, experience level, location (if specified), availability (unallocated scores higher)
- reasoning MUST cite actual data from the profile (skill name, years, project name)
- If query mentions location, weight it heavily
- If query mentions years of experience, check yearsExp values carefully
- Inferred skills count at 70% weight vs explicit skills
- Return empty array [] if truly no candidates match`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const text = (completion.choices[0].message.content ?? "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const rankings: Array<{ employeeId: string; matchScore: number; reasoning: string }> = JSON.parse(text);
    const empMap = new Map(employees.map((e) => [e.id, e]));

    // Hard filter: ignore anything the AI returns with score < 20 (LLMs don't always obey prompt rules)
    const seen = new Set<string>();
    return rankings
      .filter((r) => r.matchScore >= 20 && empMap.has(r.employeeId) && !seen.has(r.employeeId) && seen.add(r.employeeId) !== undefined)
      .map((r) => ({
        employee: empMap.get(r.employeeId)!,
        matchScore: r.matchScore,
        reasoning: r.reasoning,
      }));
  } catch (error: any) {
    console.error("Groq Search Error:", error);
    if (error.status === 429) {
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    }
    if (error.status === 401) {
      throw new Error("GROQ_API_KEY is invalid or missing. Set it in .env.local");
    }
    throw new Error(`Search failed: ${error.message || "Unknown error"}`);
  }
}
