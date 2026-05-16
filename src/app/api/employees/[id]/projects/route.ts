import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "HR" && user.employeeId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, role, techStack } = await req.json();
  if (!name) return NextResponse.json({ error: "Project name required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      employeeId: params.id,
      name,
      description: description || null,
      role: role || null,
      techStack: JSON.stringify(Array.isArray(techStack) ? techStack : (techStack ? techStack.split(",").map((s: string) => s.trim()) : [])),
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await req.json();
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
