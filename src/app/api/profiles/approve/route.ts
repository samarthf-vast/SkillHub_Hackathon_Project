import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ExtractedProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profileId, action, reviewNotes } = await req.json();

    if (!profileId || !action) {
      return NextResponse.json({ error: "Missing profileId or action" }, { status: 400 });
    }

    if (action === "REJECT") {
      const profile = await prisma.profile.update({
        where: { id: profileId },
        data: { status: "REJECTED", reviewNotes },
      });
      return NextResponse.json(profile);
    }

    if (action === "APPROVE") {
      const profile = await prisma.profile.findUnique({ where: { id: profileId } });
      if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      // Parse "YYYY-MM" or "YYYY-MM-DD" safely; returns null for invalid values
      const parseDate = (val?: string | null): Date | null => {
        if (!val) return null;
        const d = new Date(val.length === 7 ? `${val}-01` : val);
        return isNaN(d.getTime()) ? null : d;
      };

      const extracted: ExtractedProfile = JSON.parse(profile.extractedData ?? "{}");
      const { employeeId } = profile;

      // Update employee basic info
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          name: extracted.name || undefined,
          location: extracted.location || undefined,
          designation: extracted.designation || undefined,
          bio: extracted.bio || undefined,
          linkedinUrl: extracted.linkedinUrl || undefined,
        },
      });

      // Upsert skills
      const allSkills = [...(extracted.skills ?? []), ...(extracted.inferredSkills ?? [])];
      for (const skillData of allSkills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillData.name },
          update: {},
          create: { name: skillData.name, category: skillData.category },
        });

        await prisma.employeeSkill.upsert({
          where: { employeeId_skillId: { employeeId, skillId: skill.id } },
          update: { proficiency: skillData.proficiency, yearsExp: skillData.yearsExp, inferred: skillData.inferred ?? false },
          create: {
            employeeId,
            skillId: skill.id,
            proficiency: skillData.proficiency,
            yearsExp: skillData.yearsExp,
            inferred: skillData.inferred ?? false,
          },
        });
      }

      // Add projects
      for (const proj of extracted.projects ?? []) {
        const existing = await prisma.project.findFirst({
          where: { employeeId, name: proj.name },
        });
        if (!existing) {
          await prisma.project.create({
            data: {
              employeeId,
              name: proj.name,
              description: proj.description,
              role: proj.role,
              techStack: JSON.stringify(proj.techStack),
              startDate: parseDate(proj.startDate),
              endDate: parseDate(proj.endDate),
            },
          });
        }
      }

      // Add certifications
      for (const cert of extracted.certifications ?? []) {
        const existing = await prisma.certification.findFirst({
          where: { employeeId, name: cert.name },
        });
        if (!existing) {
          await prisma.certification.create({
            data: {
              employeeId,
              name: cert.name,
              issuer: cert.issuer,
              issueDate: parseDate(cert.issueDate),
            },
          });
        }
      }

      const approvedBy = session.user?.name ?? session.user?.email ?? "HR";

      await prisma.profile.update({
        where: { id: profileId },
        data: { status: "APPROVED", reviewNotes, approvedBy },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
