import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { semanticSearch, semanticSearchPending } from "@/lib/search";
import type { PendingSearchResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Fetch ALL employees who have a pending profile — regardless of search match.
    // We use this to hard-exclude them from approved results so no employee appears in both sections.
    const allPendingProfiles = await prisma.profile.findMany({
      where: { status: "PENDING" },
      select: { employeeId: true },
    });
    const allPendingEmployeeIds = new Set(allPendingProfiles.map((p) => p.employeeId));

    // Run sequentially to avoid hitting Groq rate limits with two parallel calls
    const results = await semanticSearch(query.trim());

    let pendingResults: PendingSearchResult[] = [];
    try {
      pendingResults = await semanticSearchPending(query.trim());
    } catch {
      // Pending search is optional — approved results still returned
    }

    // Exclude any employee with a pending profile from the approved section
    const filteredResults = results.filter((r) => !allPendingEmployeeIds.has(r.employee.id));

    return NextResponse.json({ results: filteredResults, pendingResults, query });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json({ error: err.message ?? "Search failed" }, { status: 500 });
  }
}
