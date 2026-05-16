import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/employees/[id]/skills — add a skill to an employee
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  // Only HR or the employee themselves can add skills
  if (user.role !== "HR" && user.employeeId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { skillName, category, proficiency, yearsExp } = await req.json();
  if (!skillName || !proficiency) {
    return NextResponse.json({ error: "skillName and proficiency are required" }, { status: 400 });
  }

  // Upsert the skill in the master list
  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    update: {},
    create: { name: skillName, category: category || "TOOL" },
  });

  // Upsert the employee-skill relationship
  const empSkill = await prisma.employeeSkill.upsert({
    where: { employeeId_skillId: { employeeId: params.id, skillId: skill.id } },
    update: { proficiency, yearsExp: parseFloat(yearsExp) || 0 },
    create: {
      employeeId: params.id,
      skillId: skill.id,
      proficiency,
      yearsExp: parseFloat(yearsExp) || 0,
      inferred: false,
    },
  });

  return NextResponse.json({ ...empSkill, skill }, { status: 201 });
}
