"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ClipboardCheck, ChevronDown, ChevronUp, Sparkles, Award, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SkillBadge from "@/components/SkillBadge";
import type { ExtractedProfile } from "@/types";

interface Profile {
  id: string; employeeId: string; status: string; source: string;
  extractedData: string; reviewNotes: string; createdAt: string;
  employee: { name: string; email: string; designation: string };
}

export default function ReviewQueuePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ name: string; action: "APPROVE" | "REJECT" } | null>(null);

  useEffect(() => {
    fetch("/api/profiles?status=PENDING").then((r) => r.json()).then(setProfiles).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const act = async (profileId: string, action: "APPROVE" | "REJECT") => {
    setProcessing(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    const res = await fetch("/api/profiles/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action, reviewNotes: notes[profileId] ?? "" }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setToast({ name: profile?.employee.name ?? "Profile", action });
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg text-white text-sm font-medium transition-all ${toast.action === "APPROVE" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.action === "APPROVE"
            ? <><CheckCircle className="h-5 w-5" /> Profile of <span className="font-bold mx-1">{toast.name}</span> approved successfully!</>
            : <><XCircle className="h-5 w-5" /> Profile of <span className="font-bold mx-1">{toast.name}</span> rejected.</>
          }
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="mt-1 text-sm text-gray-500">Approve AI-extracted profiles before they go live</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${profiles.length > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
          <span className={`h-2 w-2 rounded-full ${profiles.length > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          {profiles.length > 0 ? `${profiles.length} pending` : "All clear"}
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <ClipboardCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No profiles waiting for review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => {
            const extracted: ExtractedProfile = JSON.parse(profile.extractedData ?? "{}");
            const isExp = expanded === profile.id;
            return (
              <div key={profile.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-bold text-sm">
                      {profile.employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{profile.employee.name}</p>
                      <p className="text-xs text-gray-500">{profile.employee.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />AI Extracted
                      </span>
                      <button onClick={() => setExpanded(isExp ? null : profile.id)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {isExp ? "Collapse" : "Review"}
                      </button>
                    </div>
                  </div>

                  {/* Skill preview */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(extracted.skills ?? []).slice(0, 7).map((s) => (
                      <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} size="sm" />
                    ))}
                    {(extracted.skills ?? []).length > 7 && (
                      <span className="text-xs text-gray-400 self-center">+{(extracted.skills ?? []).length - 7} more</span>
                    )}
                  </div>
                </div>

                {/* Expanded review panel */}
                {isExp && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-5">
                    {/* Basic info */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {[
                        { label: "Name", value: extracted.name },
                        { label: "Location", value: extracted.location ?? "—" },
                        { label: "Designation", value: extracted.designation ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl border border-gray-200 bg-white p-3">
                          <p className="text-xs font-medium text-gray-400">{label}</p>
                          <p className="mt-0.5 font-semibold text-gray-800">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* LinkedIn URL */}
                    {extracted.linkedinUrl && (
                      <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
                        <Linkedin className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <a href={extracted.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline truncate">
                          {extracted.linkedinUrl}
                        </a>
                      </div>
                    )}

                    {/* All skills */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Skills ({(extracted.skills ?? []).length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(extracted.skills ?? []).map((s) => <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} size="sm" />)}
                      </div>
                    </div>

                    {/* Inferred skills */}
                    {(extracted.inferredSkills ?? []).length > 0 && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> Inferred Skills ({extracted.inferredSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(extracted.inferredSkills ?? []).map((s) => <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} inferred size="sm" />)}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {(extracted.projects ?? []).length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Projects ({extracted.projects.length})</p>
                        <div className="space-y-2">
                          {extracted.projects.map((p, i) => (
                            <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                              <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                              {p.techStack?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {p.techStack.map((t) => <span key={t} className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{t}</span>)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {(extracted.certifications ?? []).length > 0 && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />Certifications</p>
                        <div className="flex flex-wrap gap-2">
                          {extracted.certifications.map((c, i) => (
                            <span key={i} className="rounded-lg bg-white border border-amber-200 px-3 py-1 text-xs font-medium text-gray-700">{c.name}{c.issuer ? ` · ${c.issuer}` : ""}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes + actions */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Review Notes (optional)</label>
                      <Textarea placeholder="Any corrections or notes..." value={notes[profile.id] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [profile.id]: e.target.value }))} rows={2} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="success" className="flex-1" onClick={() => act(profile.id, "APPROVE")} disabled={processing === profile.id}>
                        {processing === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Approve & Apply to Profile
                      </Button>
                      <Button variant="destructive" onClick={() => act(profile.id, "REJECT")} disabled={processing === profile.id}>
                        <XCircle className="h-4 w-4" />Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
