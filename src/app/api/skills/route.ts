import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topSkillsRaw = await prisma.employeeSkill.groupBy({
    by: ["skillId"],
    _count: { skillId: true },
    orderBy: { _count: { skillId: "desc" } },
    take: 10,
  });

  const skillDetails = await prisma.skill.findMany({
    where: { id: { in: topSkillsRaw.map((s) => s.skillId) } },
  });

  const topDesignations = await prisma.employee.groupBy({
    by: ["designation"],
    _count: { designation: true },
    where: { designation: { not: null } },
    orderBy: { _count: { designation: "desc" } },
    take: 5,
  });

  const skills = topSkillsRaw.map((ts) => ({
    ...skillDetails.find((s) => s.id === ts.skillId),
    count: ts._count.skillId,
  }));

  const designations = topDesignations
    .map((d) => d.designation)
    .filter(Boolean) as string[];

  return NextResponse.json({ skills, designations });
}
