import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MapPin, Briefcase, Building2, Award, FolderOpen, ArrowLeft, Linkedin, Clock, XCircle } from "lucide-react";
import SkillBadge from "@/components/SkillBadge";
import Link from "next/link";
import { parseTechStack } from "@/lib/utils";
import type { ExtractedProfile } from "@/types";

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const [employee, approvedProfile, latestProfile] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        skills: { include: { skill: true }, orderBy: { yearsExp: "desc" } },
        projects: { orderBy: { startDate: "desc" } },
        certifications: true,
      },
    }),
    prisma.profile.findFirst({
      where: { employeeId: params.id, status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.profile.findFirst({
      where: { employeeId: params.id },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  if (!employee) notFound();

  const extractedData: ExtractedProfile | null = approvedProfile?.extractedData
    ? JSON.parse(approvedProfile.extractedData) : null;

  // For rejected/pending employees: show extracted data from latest profile as preview
  const previewProfile = !approvedProfile && latestProfile ? latestProfile : null;
  const previewData: ExtractedProfile | null = previewProfile?.extractedData
    ? JSON.parse(previewProfile.extractedData) : null;

  const linkedinUrl = employee.linkedinUrl || extractedData?.linkedinUrl || previewData?.linkedinUrl || null;

  // Use live data if available, otherwise fall back to extracted preview
  const hasLiveSkills = employee.skills.length > 0;
  const hasLiveProjects = employee.projects.length > 0;
  const hasLiveCerts = employee.certifications.length > 0;

  const previewSkills = !hasLiveSkills ? (previewData?.skills ?? []) : [];
  const previewProjects = !hasLiveProjects ? (previewData?.projects ?? []) : [];
  const previewCerts = !hasLiveCerts ? (previewData?.certifications ?? []) : [];

  const skillsByCategory = employee.skills.reduce((acc, s) => {
    const cat = s.skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, typeof employee.skills>);

  const categoryOrder = ["LANGUAGE", "FRAMEWORK", "PLATFORM", "TOOL", "DOMAIN"];
  const catColors: Record<string, string> = {
    LANGUAGE: "text-purple-600",
    FRAMEWORK: "text-indigo-600",
    PLATFORM: "text-cyan-600",
    TOOL: "text-orange-600",
    DOMAIN: "text-rose-600",
  };

  const profileStatus = latestProfile?.status ?? "NONE";

  return (
    <div className="space-y-6">
      <Link href="/hr/employees" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Directory
      </Link>

      {/* Status banner for pending/rejected */}
      {profileStatus === "PENDING" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Profile Pending Review</p>
            <p className="text-xs text-amber-600 mt-0.5">This employee has uploaded a resume that is awaiting HR approval. Skills shown below are from the pending resume.</p>
          </div>
        </div>
      )}
      {profileStatus === "REJECTED" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Profile Rejected</p>
            <p className="text-xs text-red-600 mt-0.5">
              {latestProfile?.reviewNotes
                ? <>HR note: <span className="italic">&ldquo;{latestProfile.reviewNotes}&rdquo;</span></>
                : "This employee's resume was reviewed but not approved. Skills shown below are extracted from the rejected resume."}
            </p>
          </div>
        </div>
      )}
      {profileStatus === "NONE" && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5">
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
          <p className="text-sm text-gray-500">This employee has not uploaded a resume yet.</p>
        </div>
      )}

      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className={`h-2 ${profileStatus === "APPROVED" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : profileStatus === "PENDING" ? "bg-gradient-to-r from-amber-400 to-orange-400" : profileStatus === "REJECTED" ? "bg-gradient-to-r from-red-400 to-rose-500" : "bg-gradient-to-r from-gray-300 to-gray-400"}`} />
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white font-black text-xl shadow-sm ${profileStatus === "APPROVED" ? "from-emerald-400 to-teal-500" : profileStatus === "PENDING" ? "from-amber-400 to-orange-400" : profileStatus === "REJECTED" ? "from-red-400 to-rose-500" : "from-gray-400 to-gray-500"}`}>
              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{employee.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {(employee.designation || previewData?.designation) && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {employee.designation || previewData?.designation}
                      </span>
                    )}
                    {(employee.location || previewData?.location) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {employee.location || previewData?.location}
                      </span>
                    )}
                    {employee.department && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{employee.department}</span>}
                    {linkedinUrl && (
                      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        <Linkedin className="h-4 w-4" />LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {employee.currentProject
                    ? <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700">On: {employee.currentProject}</span>
                    : <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700">Available</span>
                  }
                </div>
              </div>
              {employee.bio && <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-2xl">{employee.bio}</p>}
            </div>
          </div>

          {/* Skill count chips */}
          <div className="mt-5 flex gap-3 pt-5 border-t border-gray-100">
            {[
              { label: "Skills", value: hasLiveSkills ? employee.skills.length : previewSkills.length },
              { label: "Projects", value: hasLiveProjects ? employee.projects.length : previewProjects.length },
              { label: "Certifications", value: hasLiveCerts ? employee.certifications.length : previewCerts.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-center">
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live skills */}
      {hasLiveSkills && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Skills</h2>
          <div className="space-y-5">
            {categoryOrder.filter((c) => skillsByCategory[c]?.length).map((cat) => (
              <div key={cat}>
                <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${catColors[cat] ?? "text-gray-400"}`}>{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {skillsByCategory[cat].map((s) => (
                    <SkillBadge key={s.skill.name} name={s.skill.name} proficiency={s.proficiency} yearsExp={s.yearsExp} inferred={s.inferred} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted skills preview (for pending/rejected) */}
      {!hasLiveSkills && previewSkills.length > 0 && (
        <div className={`rounded-2xl border shadow-sm p-6 ${profileStatus === "REJECTED" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-semibold text-gray-900">Skills</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${profileStatus === "REJECTED" ? "bg-red-100 border-red-200 text-red-600" : "bg-amber-100 border-amber-200 text-amber-600"}`}>
              From {profileStatus === "REJECTED" ? "rejected" : "pending"} resume
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {previewSkills.map((s) => (
              <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} />
            ))}
          </div>
          {(previewData?.inferredSkills ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-violet-600 mb-2">Inferred Skills</p>
              <div className="flex flex-wrap gap-2">
                {previewData!.inferredSkills.map((s) => (
                  <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} inferred />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live projects */}
      {hasLiveProjects && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5"><FolderOpen className="h-5 w-5 text-indigo-500" />Projects</h2>
          <div className="space-y-3">
            {employee.projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">{project.name}</p>
                {project.role && <p className="text-sm text-indigo-600 mt-0.5 font-medium">{project.role}</p>}
                {project.description && <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{project.description}</p>}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {parseTechStack(project.techStack).filter(Boolean).map((tech) => (
                    <span key={tech} className="rounded-lg bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">{tech}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted projects preview */}
      {!hasLiveProjects && previewProjects.length > 0 && (
        <div className={`rounded-2xl border shadow-sm p-6 ${profileStatus === "REJECTED" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FolderOpen className="h-5 w-5 text-indigo-500" />Projects</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${profileStatus === "REJECTED" ? "bg-red-100 border-red-200 text-red-600" : "bg-amber-100 border-amber-200 text-amber-600"}`}>
              From {profileStatus === "REJECTED" ? "rejected" : "pending"} resume
            </span>
          </div>
          <div className="space-y-3">
            {previewProjects.map((p, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-4">
                <p className="font-semibold text-gray-900">{p.name}</p>
                {p.description && <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{p.description}</p>}
                {p.techStack?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.techStack.map((tech) => (
                      <span key={tech} className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live certifications */}
      {hasLiveCerts && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Award className="h-5 w-5 text-amber-500" />Certifications</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {employee.certifications.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                  {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted certifications preview */}
      {!hasLiveCerts && previewCerts.length > 0 && (
        <div className={`rounded-2xl border shadow-sm p-6 ${profileStatus === "REJECTED" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />Certifications</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${profileStatus === "REJECTED" ? "bg-red-100 border-red-200 text-red-600" : "bg-amber-100 border-amber-200 text-amber-600"}`}>
              From {profileStatus === "REJECTED" ? "rejected" : "pending"} resume
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {previewCerts.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3">
                <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                  {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
