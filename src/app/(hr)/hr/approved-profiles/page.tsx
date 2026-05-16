import { prisma } from "@/lib/db";
import { CheckCircle2, ArrowLeft, UserCheck, Calendar, Briefcase } from "lucide-react";
import Link from "next/link";

export default async function ApprovedProfilesPage() {
  const approvedProfiles = await prisma.profile.findMany({
    where: { status: "APPROVED" },
    include: {
      employee: {
        include: {
          skills: { include: { skill: true }, take: 3, orderBy: { yearsExp: "desc" } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/hr/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            Approved Profiles
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {approvedProfiles.length} profile{approvedProfiles.length !== 1 ? "s" : ""} approved — showing which HR approved each one
          </p>
        </div>
      </div>

      {/* Table / List */}
      {approvedProfiles.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No approved profiles yet</p>
          <p className="text-xs text-gray-400 mt-1">Profiles will appear here once HR approves them</p>
          <Link href="/hr/review-queue" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Go to Review Queue
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {approvedProfiles.map((profile) => {
              const emp = profile.employee;
              const approvedDate = new Date(profile.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <Link
                  key={profile.id}
                  href={`/hr/employees/${emp.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xs">
                    {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>

                  {/* Employee info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {emp.designation ?? "—"}
                      {emp.location ? ` · ${emp.location}` : ""}
                    </p>
                    {/* Skills */}
                    <div className="mt-1.5 flex gap-1.5 flex-wrap">
                      {emp.skills.map((s) => (
                        <span key={s.skill.id} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Approved by */}
                  <div className="flex-shrink-0 text-right hidden sm:block min-w-[140px]">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Approved by</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex-shrink-0">
                        {(profile.approvedBy ?? "HR").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 capitalize">
                        {profile.approvedBy ?? "HR"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{approvedDate}</span>
                    </div>
                  </div>

                  {/* Mobile: approved by badge */}
                  <div className="flex-shrink-0 sm:hidden">
                    <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg">
                      <UserCheck className="h-3 w-3 text-indigo-500" />
                      <span className="text-xs font-medium text-indigo-700 capitalize">
                        {profile.approvedBy ?? "HR"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary footer */}
      {approvedProfiles.length > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700">
              <span className="font-semibold">{approvedProfiles.length} profiles</span> have been approved.
              {(() => {
                const hrSet = Array.from(new Set(approvedProfiles.map((p) => p.approvedBy ?? "HR")));
                const hrList = hrSet;
                return hrList.length > 0
                  ? ` Approved by: ${hrList.join(", ")}.`
                  : "";
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
