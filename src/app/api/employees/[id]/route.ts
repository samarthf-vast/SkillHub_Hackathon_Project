import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      skills: { include: { skill: true }, orderBy: { yearsExp: "desc" } },
      projects: { orderBy: { startDate: "desc" } },
      certifications: true,
      profiles: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      name: body.name,
      location: body.location,
      designation: body.designation,
      department: body.department,
      bio: body.bio,
      currentProject: body.currentProject,
    },
  });

  return NextResponse.json(employee);
}
