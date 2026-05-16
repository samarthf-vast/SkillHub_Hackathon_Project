"use client";

import { useEffect, useState } from "react";
import { Search, Users, MapPin, Briefcase, Clock, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import SkillBadge from "@/components/SkillBadge";
import Link from "next/link";
import type { ExtractedProfile } from "@/types";

function getDisplayData(emp: any) {
  const latestProfile = emp.profiles?.[0] ?? null;
  const status: string = latestProfile?.status ?? "NONE";
  const extracted: ExtractedProfile | null = latestProfile?.extractedData
    ? JSON.parse(latestProfile.extractedData) : null;
  const liveSkills: any[] = emp.skills ?? [];
  const displaySkills = liveSkills.length > 0
    ? liveSkills.map((s: any) => ({ name: s.skill.name, proficiency: s.proficiency, live: true }))
    : (extracted?.skills ?? []).map((s) => ({ name: s.name, proficiency: s.proficiency, live: false }));
  return { status, extracted, displaySkills, liveSkills };
}

function EmployeeCard({ emp }: { emp: any }) {
  const { status, extracted, displaySkills, liveSkills } = getDisplayData(emp);
  const borderColor = status === "APPROVED" ? "hover:border-emerald-300" : status === "PENDING" ? "hover:border-amber-300" : status === "REJECTED" ? "hover:border-red-300" : "hover:border-indigo-200";
  const avatarGrad = status === "APPROVED" ? "from-emerald-400 to-teal-500" : status === "PENDING" ? "from-amber-400 to-orange-400" : status === "REJECTED" ? "from-red-400 to-rose-500" : "from-indigo-400 to-violet-500";

  return (
    <Link href={`/hr/employees/${emp.id}`} className={`group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md ${borderColor} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGrad} text-white font-bold text-xs`}>
            {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{emp.name}</p>
            <div className="flex flex-col gap-0.5 mt-0.5">
              {(emp.designation || extracted?.designation) && (
                <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                  {emp.designation || extracted?.designation}
                </span>
              )}
              {(emp.location || extracted?.location) && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {emp.location || extracted?.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${emp.currentProject ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
          {emp.currentProject ? "Allocated" : "Available"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {displaySkills.slice(0, 3).map((s) => (
          <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} size="sm" />
        ))}
        {displaySkills.length > 3 && (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{displaySkills.length - 3}</span>
        )}
        {displaySkills.length === 0 && <span className="text-xs text-gray-400">No resume uploaded yet</span>}
        {displaySkills.length > 0 && !liveSkills.length && (
          <span className="rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs text-amber-600">from resume</span>
        )}
      </div>
    </Link>
  );
}

function Section({ title, icon, count, color, children }: {
  title: string; icon: React.ReactNode; count: number; color: string; children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${color}`}>
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <span className="ml-auto text-sm font-medium text-gray-500">{count} employee{count !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEmployees = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/employees${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    setEmployees(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchEmployees(search), 300); return () => clearTimeout(t); }, [search]);

  const approved = employees.filter((e) => e.profiles?.[0]?.status === "APPROVED");
  const pending = employees.filter((e) => e.profiles?.[0]?.status === "PENDING");
  const rejected = employees.filter((e) => e.profiles?.[0]?.status === "REJECTED");
  const noProfile = employees.filter((e) => !e.profiles?.[0]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
        <p className="mt-1 text-sm text-gray-500">{employees.length} employee{employees.length !== 1 ? "s" : ""} total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search by name, skill, location, designation…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-14 bg-gray-100 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-20 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-200 mb-3" />
          <p className="font-semibold text-gray-500">No employees found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try a different search term</p>}
          {!search && <p className="text-sm text-gray-400 mt-1">Employees will appear here once they register</p>}
        </div>
      ) : (
        <div className="space-y-10">
          <Section
            title="Approved Profiles"
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
            count={approved.length}
            color="border-emerald-200"
          >
            {approved.map((emp) => <EmployeeCard key={emp.id} emp={emp} />)}
          </Section>

          <Section
            title="Pending Review"
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            count={pending.length}
            color="border-amber-200"
          >
            {pending.map((emp) => <EmployeeCard key={emp.id} emp={emp} />)}
          </Section>

          <Section
            title="Rejected Profiles"
            icon={<XCircle className="h-5 w-5 text-red-400" />}
            count={rejected.length}
            color="border-red-200"
          >
            {rejected.map((emp) => <EmployeeCard key={emp.id} emp={emp} />)}
          </Section>

          <Section
            title="No Resume Uploaded"
            icon={<Users className="h-5 w-5 text-gray-400" />}
            count={noProfile.length}
            color="border-gray-200"
          >
            {noProfile.map((emp) => <EmployeeCard key={emp.id} emp={emp} />)}
          </Section>
        </div>
      )}
    </div>
  );
}
