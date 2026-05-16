"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Briefcase, Building2, Award, FolderOpen, Plus, Trash2, Loader2, Save, Pencil, Clock, CheckCircle, Lock, Eye, EyeOff, XCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SkillBadge from "@/components/SkillBadge";
import Link from "next/link";
import { parseTechStack } from "@/lib/utils";
import type { ExtractedProfile } from "@/types";

const CATEGORIES = ["LANGUAGE", "FRAMEWORK", "PLATFORM", "TOOL", "DOMAIN"];
const PROFICIENCIES = ["NOVICE", "INTERMEDIATE", "EXPERT"];

export default function EmployeeProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const employeeId = user?.employeeId;

  const [employee, setEmployee] = useState<any>(null);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [approvedProfile, setApprovedProfile] = useState<any>(null);
  const [rejectedProfile, setRejectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", designation: "", location: "", department: "", bio: "", currentProject: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({ skillName: "", category: "TOOL", proficiency: "INTERMEDIATE", yearsExp: "1" });
  const [addingSkill, setAddingSkill] = useState(false);

  const [showAddProject, setShowAddProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", role: "", techStack: "" });
  const [addingProject, setAddingProject] = useState(false);

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const fetchData = async () => {
    if (!employeeId) return;
    const [emp, allProfiles] = await Promise.all([
      fetch(`/api/employees/${employeeId}`).then((r) => r.json()),
      fetch(`/api/profiles?employeeId=${employeeId}`).then((r) => r.json()),
    ]);
    setEmployee(emp);
    const profiles = Array.isArray(allProfiles)
      ? [...allProfiles].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : [];
    setPendingProfile(profiles.find((p: any) => p.status === "PENDING") ?? null);
    setApprovedProfile(profiles.find((p: any) => p.status === "APPROVED") ?? null);
    setRejectedProfile(profiles.find((p: any) => p.status === "REJECTED") ?? null);
    setInfoForm({
      name: emp.name ?? "",
      designation: emp.designation ?? "",
      location: emp.location ?? "",
      department: emp.department ?? "",
      bio: emp.bio ?? "",
      currentProject: emp.currentProject ?? "",
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [employeeId]);

  const saveInfo = async () => {
    setSavingInfo(true);
    await fetch(`/api/employees/${employeeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(infoForm) });
    await fetchData();
    setSavingInfo(false);
    setEditingInfo(false);
  };

  const addSkill = async () => {
    if (!skillForm.skillName.trim()) return;
    setAddingSkill(true);
    await fetch(`/api/employees/${employeeId}/skills`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(skillForm) });
    setSkillForm({ skillName: "", category: "TOOL", proficiency: "INTERMEDIATE", yearsExp: "1" });
    setShowAddSkill(false);
    await fetchData();
    setAddingSkill(false);
  };

  const removeSkill = async (skillId: string) => {
    await fetch(`/api/employees/${employeeId}/skills/${skillId}`, { method: "DELETE" });
    await fetchData();
  };

  const addProject = async () => {
    if (!projectForm.name.trim()) return;
    setAddingProject(true);
    await fetch(`/api/employees/${employeeId}/projects`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(projectForm) });
    setProjectForm({ name: "", description: "", role: "", techStack: "" });
    setShowAddProject(false);
    await fetchData();
    setAddingProject(false);
  };

  const removeProject = async (projectId: string) => {
    await fetch(`/api/employees/${employeeId}/projects`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) });
    await fetchData();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Passwords do not match"); return; }
    if (pwdForm.next.length < 6) { setPwdError("New password must be at least 6 characters"); return; }
    setPwdLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.next }),
    });
    const data = await res.json();
    setPwdLoading(false);
    if (!res.ok) { setPwdError(data.error ?? "Failed to update password"); return; }
    setPwdSuccess(true);
    setPwdForm({ current: "", next: "", confirm: "" });
    setTimeout(() => { setPwdSuccess(false); setShowChangePwd(false); }, 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
    </div>
  );

  if (!employee) return null;

  // Most recent profile determines the active status — prevents old approved profiles overriding newer rejections
  const latestProfile = [pendingProfile, approvedProfile, rejectedProfile]
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
  const latestStatus: string = latestProfile?.status ?? "NONE";

  const previewProfile = latestStatus === "PENDING" ? pendingProfile : latestStatus === "REJECTED" ? rejectedProfile : null;
  const pendingExtracted: ExtractedProfile | null = previewProfile
    ? JSON.parse(previewProfile.extractedData ?? "{}") : null;

  const liveSkills = employee.skills ?? [];
  const liveProjects = employee.projects ?? [];
  const liveCerts = employee.certifications ?? [];
  const hasLiveData = liveSkills.length > 0 || liveProjects.length > 0 || liveCerts.length > 0;

  const skillsByCategory = liveSkills.reduce((acc: any, s: any) => {
    const cat = s.skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const pendingBadge = latestStatus === "PENDING" ? (
    <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 ml-2">
      Pending approval
    </span>
  ) : latestStatus === "REJECTED" && !hasLiveData ? (
    <span className="text-xs font-normal text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 ml-2">
      From rejected resume
    </span>
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <Link href="/employee/upload">
          <Button size="sm" variant="outline">Upload Resume</Button>
        </Link>
      </div>

      {/* Status banner — driven by MOST RECENT profile date */}
      {latestStatus === "PENDING" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Pending HR Approval</p>
            <p className="text-sm text-amber-700">Your resume is under review. The data below shows what will be applied once HR approves it.</p>
          </div>
        </div>
      )}
      {latestStatus === "APPROVED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Resume Approved by HR</p>
            <p className="text-sm text-emerald-700">Your profile has been reviewed and all data is now live.</p>
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
              Upload New Resume
            </Link>
          </div>
        </div>
      )}

      {/* Profile Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-xl">
              {employee.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              {!editingInfo ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
                      <p className="text-sm text-gray-500">{employee.email}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                        {employee.designation && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{employee.designation}</span>}
                        {employee.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{employee.location}</span>}
                        {employee.department && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{employee.department}</span>}
                      </div>
                      {employee.bio && <p className="mt-2 text-sm text-gray-600">{employee.bio}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {employee.currentProject ? <Badge variant="warning">On: {employee.currentProject}</Badge> : <Badge variant="success">Available</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => setEditingInfo(true)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-gray-600">Full Name</label><Input value={infoForm.name} onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })} /></div>
                    <div><label className="text-xs font-medium text-gray-600">Job Title</label><Input value={infoForm.designation} onChange={(e) => setInfoForm({ ...infoForm, designation: e.target.value })} placeholder="Frontend Engineer" /></div>
                    <div><label className="text-xs font-medium text-gray-600">Location</label><Input value={infoForm.location} onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value })} placeholder="Pune" /></div>
                    <div><label className="text-xs font-medium text-gray-600">Department</label><Input value={infoForm.department} onChange={(e) => setInfoForm({ ...infoForm, department: e.target.value })} placeholder="Engineering" /></div>
                    <div className="col-span-2"><label className="text-xs font-medium text-gray-600">Current Project</label><Input value={infoForm.currentProject} onChange={(e) => setInfoForm({ ...infoForm, currentProject: e.target.value })} placeholder="Leave blank if available" /></div>
                    <div className="col-span-2"><label className="text-xs font-medium text-gray-600">Bio</label><Textarea value={infoForm.bio} onChange={(e) => setInfoForm({ ...infoForm, bio: e.target.value })} rows={2} placeholder="Short professional summary" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveInfo} disabled={savingInfo}>{savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              Skills ({hasLiveData ? liveSkills.length : (pendingExtracted?.skills?.length ?? 0)})
              {pendingProfile && !hasLiveData && pendingBadge}
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddSkill(!showAddSkill)}>
              <Plus className="h-4 w-4" />Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddSkill && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <p className="text-sm font-medium text-indigo-900">Add a Skill</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Input placeholder="Skill name (e.g. React, Python, AWS)" value={skillForm.skillName} onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })} /></div>
                <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={skillForm.category} onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={skillForm.proficiency} onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}>
                  {PROFICIENCIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <div><Input type="number" min="0" step="0.5" placeholder="Years of exp" value={skillForm.yearsExp} onChange={(e) => setSkillForm({ ...skillForm, yearsExp: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addSkill} disabled={addingSkill}>{addingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddSkill(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Live skills */}
          {liveSkills.length > 0 && Object.entries(skillsByCategory).map(([cat, skills]: any) => (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: any) => (
                  <div key={s.skill.id} className="group relative">
                    <SkillBadge name={s.skill.name} proficiency={s.proficiency} yearsExp={s.yearsExp} inferred={s.inferred} />
                    <button onClick={() => removeSkill(s.skill.id)} className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white" title="Remove">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pending/rejected preview skills */}
          {liveSkills.length === 0 && (pendingExtracted?.skills ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(pendingExtracted?.skills ?? []).map((s) => (
                <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} />
              ))}
            </div>
          )}

          {liveSkills.length === 0 && (pendingExtracted?.skills ?? []).length === 0 && !showAddSkill && (
            <p className="text-sm text-gray-400 text-center py-4">No skills yet. Add skills or upload your resume.</p>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-500" />
              Projects ({hasLiveData ? liveProjects.length : (pendingExtracted?.projects?.length ?? 0)})
              {pendingProfile && !hasLiveData && pendingBadge}
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddProject(!showAddProject)}>
              <Plus className="h-4 w-4" />Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddProject && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <p className="text-sm font-medium text-indigo-900">Add a Project</p>
              <Input placeholder="Project name *" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
              <Input placeholder="Your role (e.g. Tech Lead, Frontend Developer)" value={projectForm.role} onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })} />
              <Textarea placeholder="Short description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} rows={2} />
              <Input placeholder="Tech stack (comma separated: React, Node.js, AWS)" value={projectForm.techStack} onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={addProject} disabled={addingProject}>{addingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddProject(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Live projects */}
          {liveProjects.map((project: any) => (
            <div key={project.id} className="group rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{project.name}</p>
                  {project.role && <p className="text-sm text-indigo-600 mt-0.5">{project.role}</p>}
                  {project.description && <p className="mt-1 text-sm text-gray-600">{project.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parseTechStack(project.techStack).filter(Boolean).map((tech: string) => (
                      <span key={tech} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{tech}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => removeProject(project.id)} className="ml-3 hidden group-hover:block text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pending preview projects */}
          {liveProjects.length === 0 && (pendingExtracted?.projects ?? []).map((p, i) => (
            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <p className="font-semibold text-gray-900">{p.name}</p>
              {p.role && <p className="text-sm text-indigo-600 mt-0.5">{p.role}</p>}
              {p.description && <p className="mt-1 text-sm text-gray-600">{p.description}</p>}
              {p.techStack?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.techStack.map((t) => <span key={t} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{t}</span>)}
                </div>
              )}
            </div>
          ))}

          {liveProjects.length === 0 && (pendingExtracted?.projects ?? []).length === 0 && !showAddProject && (
            <p className="text-sm text-gray-400 text-center py-4">No projects yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-gray-500" />Change Password</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setShowChangePwd(!showChangePwd); setPwdError(""); setPwdSuccess(false); }}>
              {showChangePwd ? "Cancel" : "Update Password"}
            </Button>
          </div>
        </CardHeader>
        {showChangePwd && (
          <CardContent>
            <form onSubmit={changePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="text-xs font-medium text-gray-600">Current Password</label>
                <div className="relative mt-1">
                  <Input type={showPwd ? "text" : "password"} placeholder="Enter current password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} required className="pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">New Password</label>
                <Input type="password" placeholder="Min. 6 characters" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
                <Input type="password" placeholder="Repeat new password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} required className="mt-1" />
              </div>
              {pwdError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{pwdError}</div>}
              {pwdSuccess && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Password updated successfully!</div>}
              <Button type="submit" size="sm" disabled={pwdLoading}>
                {pwdLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : <><Save className="h-4 w-4" />Save Password</>}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Certifications */}
      {(liveCerts.length > 0 || (pendingExtracted?.certifications ?? []).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Certifications ({hasLiveData ? liveCerts.length : (pendingExtracted?.certifications?.length ?? 0)})
              {pendingProfile && !hasLiveData && pendingBadge}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {liveCerts.length > 0
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
    </div>
  );
}
