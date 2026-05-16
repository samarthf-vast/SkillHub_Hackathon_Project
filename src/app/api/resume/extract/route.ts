import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractProfileFromResume } from "@/lib/extract";
import { prisma } from "@/lib/db";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

async function extractPDFText(buffer: Buffer): Promise<string> {
  const tmpFile = join(tmpdir(), `resume_${Date.now()}.pdf`);
  try {
    writeFileSync(tmpFile, buffer);
    const text = execSync(`pdftotext "${tmpFile}" -`, { encoding: "utf8", timeout: 15000 });
    return text.trim();
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const employeeId = formData.get("employeeId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!employeeId) return NextResponse.json({ error: "No employeeId provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractPDFText(buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    const extracted = await extractProfileFromResume(resumeText);

    // Delete any existing PENDING profiles for this employee before creating a new one
    await prisma.profile.deleteMany({
      where: { employeeId, status: "PENDING" },
    });

    const profile = await prisma.profile.create({
      data: {
        employeeId,
        status: "PENDING",
        source: "RESUME",
        rawText: resumeText.substring(0, 10000),
        extractedData: JSON.stringify(extracted),
      },
    });

    return NextResponse.json({ profileId: profile.id, extracted });
  } catch (err: any) {
    console.error("Extract error:", err);
    return NextResponse.json({ error: err.message ?? "Extraction failed" }, { status: 500 });
  }
}
