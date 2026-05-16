import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE /api/employees/[id]/skills/[skillId]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; skillId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "HR" && user.employeeId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.employeeSkill.deleteMany({
    where: { employeeId: params.id, skillId: params.skillId },
  });

  return NextResponse.json({ success: true });
}
