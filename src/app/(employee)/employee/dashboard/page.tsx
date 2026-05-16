"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Upload, User, Loader2, CheckCircle, Clock, Award, Briefcase, XCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkillBadge from "@/components/SkillBadge";
import type { ExtractedProfile } from "@/types";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [employee, setEmployee] = useState<any>(null);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [approvedProfile, setApprovedProfile] = useState<any>(null);
  const [rejectedProfile, setRejectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employeeId) return;
    Promise.all([
      fetch(`/api/employees/${user.employeeId}`).then((r) => r.json()),
      fetch(`/api/profiles?employeeId=${user.employeeId}&status=PENDING`).then((r) => r.json()),
      fetch(`/api/profiles?employeeId=${user.employeeId}&status=APPROVED`).then((r) => r.json()),
      fetch(`/api/profiles?employeeId=${user.employeeId}&status=REJECTED`).then((r) => r.json()),
    ]).then(([emp, pending, approved, rejected]) => {
      setEmployee(emp);
      setPendingProfile(Array.isArray(pending) && pending.length > 0 ? pending[0] : null);
      setApprovedProfile(Array.isArray(approved) && approved.length > 0 ? approved[approved.length - 1] : null);
      setRejectedProfile(Array.isArray(rejected) && rejected.length > 0 ? rejected[rejected.length - 1] : null);
      setLoading(false);
    });
  }, [user?.employeeId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
    </div>
  );

  if (!employee) return null;

  const firstName = employee.name?.split(" ")[0] ?? "there";

  // Find the most recent profile by date — this determines the active status shown to employee
  const latestProfile = [pendingProfile, approvedProfile, rejectedProfile]
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
  const latestStatus: string = latestProfile?.status ?? "NONE";

  // Show preview data from pending or rejected resume if the latest action was pending/rejected
  const previewProfile = latestStatus === "PENDING" ? pendingProfile : latestStatus === "REJECTED" ? rejectedProfile : null;
  const pendingExtracted: ExtractedProfile | null = previewProfile
    ? JSON.parse(previewProfile.extractedData ?? "{}") : null;

  const liveSkills = employee.skills ?? [];
  const liveProjects = employee.projects ?? [];
  const liveCerts = employee.certifications ?? [];

  // Compute total experience from skills
  const totalExp = liveSkills.length > 0
    ? Math.max(...liveSkills.map((s: any) => s.yearsExp ?? 0))
    : pendingExtracted?.skills?.length
    ? Math.max(...(pendingExtracted.skills.map((s) => s.yearsExp ?? 0)))
    : 0;

  const showLiveData = liveSkills.length > 0 || liveProjects.length > 0 || liveCerts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-gray-500">
          {employee.designation ?? "Employee"}{employee.department ? ` · ${employee.department}` : ""}
          {employee.location ? ` · ${employee.location}` : ""}
        </p>
      </div>

      {/* Status banner — driven by the MOST RECENT profile, not just any approved profile */}
      {latestStatus === "PENDING" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Pending HR Approval</p>
            <p className="text-sm text-amber-700">Your resume has been submitted and is waiting for HR review. The preview below shows what will be applied once approved.</p>
          </div>
        </div>
      )}
      {latestStatus === "APPROVED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Resume Approved by HR</p>
            <p className="text-sm text-emerald-700">Your profile has been reviewed and approved. All skills, projects, and certifications are now live.</p>
            {approvedProfile?.reviewNotes && (
              <div className="mt-2 flex items-start gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 font-medium">HR Note: <span className="font-normal">{approvedProfile.reviewNotes}</span></p>
              </div>
            )}
          </div>
        </div>
      )}
      {latestStatus === "REJECTED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Latest Resume Rejected by HR</p>
            <div className="mt-1 flex items-start gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                {rejectedProfile?.reviewNotes
                  ? rejectedProfile.reviewNotes
                  : "Your resume was reviewed but could not be approved. Please upload an updated resume — your current skillset does not match the required job role. Review the job description and tailor your resume accordingly."}
              </p>
            </div>
            <Link href="/employee/upload" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
              <Upload className="h-3 w-3" /> Upload New Resume
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/employee/upload">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-indigo-200 bg-indigo-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-indigo-100 p-3"><Upload className="h-5 w-5 text-indigo-600" /></div>
              <div>
                <p className="font-semibold text-indigo-900">Upload Resume</p>
                <p className="text-sm text-indigo-700">AI extracts your skills automatically</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/employee/profile">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-gray-100 p-3"><User className="h-5 w-5 text-gray-600" /></div>
              <div>
                <p className="font-semibold text-gray-900">Manage Profile</p>
                <p className="text-sm text-gray-500">Add skills, projects, edit info</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats — show live data or pending preview */}
      {(showLiveData || pendingExtracted) && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Exp", value: `${totalExp}yr`, icon: "🏆" },
            { label: "Skills", value: showLiveData ? liveSkills.length : (pendingExtracted?.skills?.length ?? 0), icon: "⚡" },
            { label: "Projects", value: showLiveData ? liveProjects.length : (pendingExtracted?.projects?.length ?? 0), icon: "🚀" },
            { label: "Certifications", value: showLiveData ? liveCerts.length : (pendingExtracted?.certifications?.length ?? 0), icon: "🎓" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Skills */}
      {(showLiveData ? liveSkills.length > 0 : (pendingExtracted?.skills?.length ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Skills
              {pendingProfile && <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending approval</span>}
              {!pendingProfile && rejectedProfile && !showLiveData && <span className="text-xs font-normal text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">From rejected resume</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {showLiveData
                ? liveSkills.slice(0, 15).map((s: any) => (
                    <SkillBadge key={s.skill.name} name={s.skill.name} proficiency={s.proficiency} yearsExp={s.yearsExp} inferred={s.inferred} />
                  ))
                : (pendingExtracted?.skills ?? []).slice(0, 15).map((s) => (
                    <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} />
                  ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {(showLiveData ? liveProjects.length > 0 : (pendingExtracted?.projects?.length ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Projects
              {pendingProfile && <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending approval</span>}
              {!pendingProfile && rejectedProfile && !showLiveData && <span className="text-xs font-normal text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">From rejected resume</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {showLiveData
              ? liveProjects.map((p: any) => (
                  <div key={p.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                    {p.role && <p className="text-xs text-indigo-600 mt-0.5">Role: {p.role}</p>}
                  </div>
                ))
              : (pendingExtracted?.projects ?? []).map((p, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                    {p.role && <p className="text-xs text-indigo-600 mt-0.5">Role: {p.role}</p>}
                    {p.techStack?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.techStack.map((t) => <span key={t} className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))
            }
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {(showLiveData ? liveCerts.length > 0 : (pendingExtracted?.certifications?.length ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" /> Certifications
              {pendingProfile && <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending approval</span>}
              {!pendingProfile && rejectedProfile && !showLiveData && <span className="text-xs font-normal text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">From rejected resume</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {showLiveData
                ? liveCerts.map((c: any) => (
                    <span key={c.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      🎓 {c.name}{c.issuer ? ` · ${c.issuer}` : ""}
                    </span>
                  ))
                : (pendingExtracted?.certifications ?? []).map((c, i) => (
                    <span key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      🎓 {c.name}{c.issuer ? ` · ${c.issuer}` : ""}
                    </span>
                  ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!showLiveData && !pendingExtracted && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-2">Your skills profile is empty</p>
            <p className="text-sm text-gray-400 mb-4">Upload your resume to auto-extract skills, or add them manually</p>
            <div className="flex justify-center gap-3">
              <Link href="/employee/upload"><span className="text-indigo-600 text-sm font-medium hover:underline">Upload Resume →</span></Link>
              <Link href="/employee/profile"><span className="text-indigo-600 text-sm font-medium hover:underline">Add Manually →</span></Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
