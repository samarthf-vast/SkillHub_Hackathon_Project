import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  const where: any = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;

  // Employees can only see their own profiles
  const user = session.user as any;
  if (user.role === "EMPLOYEE" && user.employeeId) {
    where.employeeId = user.employeeId;
  }

  const profiles = await prisma.profile.findMany({
    where,
    include: { employee: { select: { name: true, email: true, designation: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
}
