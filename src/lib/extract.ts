import { getClient } from "./ai";
import type { ExtractedProfile } from "@/types";

const INFERENCE_RULES: Record<string, { name: string; category: string }[]> = {
  "Next.js": [{ name: "React", category: "FRAMEWORK" }, { name: "JavaScript", category: "LANGUAGE" }],
  "React Native": [{ name: "React", category: "FRAMEWORK" }, { name: "JavaScript", category: "LANGUAGE" }],
  "Vue.js": [{ name: "JavaScript", category: "LANGUAGE" }],
  "Angular": [{ name: "TypeScript", category: "LANGUAGE" }, { name: "JavaScript", category: "LANGUAGE" }],
  "TypeScript": [{ name: "JavaScript", category: "LANGUAGE" }],
  "Spring Boot": [{ name: "Java", category: "LANGUAGE" }],
  "FastAPI": [{ name: "Python", category: "LANGUAGE" }],
  "PyTorch": [{ name: "Machine Learning", category: "DOMAIN" }, { name: "Python", category: "LANGUAGE" }],
  "TensorFlow": [{ name: "Machine Learning", category: "DOMAIN" }, { name: "Python", category: "LANGUAGE" }],
  "Razorpay": [{ name: "Payment Gateway", category: "DOMAIN" }],
  "Stripe": [{ name: "Payment Gateway", category: "DOMAIN" }],
  "Socket.IO": [{ name: "WebSocket", category: "TOOL" }],
  "Kubernetes": [{ name: "DevOps", category: "DOMAIN" }, { name: "Docker", category: "PLATFORM" }],
  "Terraform": [{ name: "DevOps", category: "DOMAIN" }],
};

export async function extractProfileFromResume(resumeText: string): Promise<ExtractedProfile> {
  const client = getClient();

  const prompt = `You are an expert at parsing resumes and extracting structured skill data.

Analyze this resume and extract ALL relevant information. Return a JSON object ONLY (no markdown, no explanation, no code blocks).

Resume:
${resumeText}

Return this exact JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "location": "City",
  "designation": "Job Title",
  "bio": "One-line professional summary",
  "linkedinUrl": "https://linkedin.com/in/username or null if not found",
  "skills": [
    {
      "name": "Skill Name",
      "category": "LANGUAGE or FRAMEWORK or PLATFORM or TOOL or DOMAIN",
      "proficiency": "NOVICE or INTERMEDIATE or EXPERT",
      "yearsExp": 2.5
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "role": "Role played",
      "techStack": ["Tech1", "Tech2"],
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issueDate": "YYYY-MM"
    }
  ],
  "inferredSkills": []
}

Rules:
- Proficiency: NOVICE (under 1yr), INTERMEDIATE (1-3yr), EXPERT (3yr+)
- Categories: LANGUAGE (JS, Python, Java), FRAMEWORK (React, Spring), PLATFORM (AWS, Docker), TOOL (PostgreSQL, Redis), DOMAIN (Payment, ML, DevOps)
- inferredSkills: leave as empty array
- Return only valid JSON`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const text = (completion.choices[0].message.content ?? "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const extracted: ExtractedProfile = JSON.parse(text);

    // Apply inference rules
    const existingSkillNames = new Set(extracted.skills.map((s) => s.name.toLowerCase()));
    const inferred: typeof extracted.inferredSkills = [];

    for (const skill of extracted.skills) {
      const rules = INFERENCE_RULES[skill.name];
      if (rules) {
        for (const infer of rules) {
          if (!existingSkillNames.has(infer.name.toLowerCase())) {
            inferred.push({
              name: infer.name,
              category: infer.category as any,
              proficiency: skill.proficiency === "EXPERT" ? "INTERMEDIATE" : "NOVICE",
              yearsExp: Math.max(skill.yearsExp - 1, 0.5),
              inferred: true,
            });
            existingSkillNames.add(infer.name.toLowerCase());
          }
        }
      }
    }

    extracted.inferredSkills = inferred;
    return extracted;
  } catch (error: any) {
    console.error("Groq API Error:", error);
    if (error.status === 429) {
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    }
    if (error.status === 401) {
      throw new Error("GROQ_API_KEY is invalid or missing. Set it in .env.local");
    }
    throw new Error(`Resume extraction failed: ${error.message || "Unknown error"}`);
  }
}
