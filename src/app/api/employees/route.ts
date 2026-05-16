import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const employees = await prisma.employee.findMany({
    where: search
      ? {
          user: { role: "EMPLOYEE" },
          OR: [
            { name: { contains: search } },
            { location: { contains: search } },
            { designation: { contains: search } },
            { skills: { some: { skill: { name: { contains: search } } } } },
          ],
        }
      : { user: { role: "EMPLOYEE" } },
    include: {
      skills: { include: { skill: true } },
      projects: true,
      certifications: true,
      profiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, status: true, extractedData: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}
