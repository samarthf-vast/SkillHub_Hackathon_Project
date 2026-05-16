import { prisma } from "@/lib/db";
import { Users, ClipboardCheck, CheckCircle2, Search, ArrowRight, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default async function HRDashboard() {
  const [totalEmployees, pendingProfiles, approvedProfiles, recentEmployees, topSkillsRaw] = await Promise.all([
    prisma.employee.count({ where: { user: { role: "EMPLOYEE" } } }),
    prisma.profile.count({ where: { status: "PENDING" } }),
    prisma.profile.count({ where: { status: "APPROVED" } }),
    prisma.employee.findMany({
      where: { user: { role: "EMPLOYEE" } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { skills: { include: { skill: true }, take: 3, orderBy: { yearsExp: "desc" } } },
    }),
    prisma.employeeSkill.groupBy({
      by: ["skillId"],
      _count: { skillId: true },
      orderBy: { _count: { skillId: "desc" } },
      take: 10,
    }),
  ]);

  const skillDetails = await prisma.skill.findMany({ where: { id: { in: topSkillsRaw.map((s) => s.skillId) } } });
  const topSkills = topSkillsRaw.map((ts) => ({
    ...skillDetails.find((s) => s.id === ts.skillId),
    count: ts._count.skillId,
  }));

  const stats = [
    { label: "Employees", value: totalEmployees, icon: Users, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Pending Reviews", value: pendingProfiles, icon: ClipboardCheck, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600", href: "/hr/review-queue" },
    { label: "Approved Profiles", value: approvedProfiles, icon: CheckCircle2, color: "from-emerald-500 to-green-600", bg: "bg-emerald-50", text: "text-emerald-600", href: "/hr/approved-profiles" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your skills intelligence platform</p>
        </div>
        <Link href="/hr/search" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Search className="h-4 w-4" />
          Search Talent
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${stat.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
            {stat.href ? (
              <Link href={stat.href} className="absolute inset-0" />
            ) : null}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-xl ${stat.bg} p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.text}`} />
              </div>
            </div>
            {stat.href === "/hr/review-queue" && stat.value > 0 && (
              <p className="mt-3 text-xs font-medium text-amber-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Needs your attention
              </p>
            )}
            {stat.href === "/hr/approved-profiles" && stat.value > 0 && (
              <p className="mt-3 text-xs font-medium text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Click to view all
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Search CTA */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3 flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">AI-Powered Talent Search</h3>
              <p className="mt-1 text-sm text-indigo-200">Ask anything about your team in plain English and get AI-ranked candidates with match scores and reasoning.</p>
              <Link href="/hr/search" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
                Try it now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Top skills */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Top Skills</h3>
          </div>
          <div className="space-y-2.5">
            {topSkills.slice(0, 6).map((s: any, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{s.count}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-100">
                    <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${Math.round((s.count / (topSkills[0]?.count ?? 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {topSkills.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No skills yet</p>}
          </div>
        </div>
      </div>

      {/* Recent employees */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Recent Employees
          </h3>
          <Link href="/hr/employees" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentEmployees.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No employees yet</p>
            <p className="text-xs text-gray-400 mt-1">Employees will appear here once they register</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentEmployees.map((emp) => (
              <Link key={emp.id} href={`/hr/employees/${emp.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-bold text-xs">
                  {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.designation ?? emp.department ?? "—"} {emp.location ? `· ${emp.location}` : ""}</p>
                </div>
                <div className="flex gap-1.5">
                  {emp.skills.slice(0, 2).map((s) => (
                    <span key={s.skill.name} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">{s.skill.name}</span>
                  ))}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
