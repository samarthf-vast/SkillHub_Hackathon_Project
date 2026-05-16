"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Sparkles } from "lucide-react";
import ResumeUploader from "@/components/ResumeUploader";
import SkillBadge from "@/components/SkillBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExtractedProfile } from "@/types";

export default function UploadPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  if (!session) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!user?.employeeId) return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-lg font-medium">Session expired — please sign out and sign back in.</p>
    </div>
  );

  const handleExtracted = (data: ExtractedProfile, id: string) => {
    setExtracted(data);
    setProfileId(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
        <p className="mt-1 text-gray-500">Upload your PDF resume — AI will extract your skills, projects, and experience</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <ResumeUploader employeeId={user.employeeId} onExtracted={handleExtracted} />
        </CardContent>
      </Card>

      {extracted && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-900">Extraction complete — pending HR review</p>
              <p className="text-sm text-emerald-700">Your profile has been submitted. HR will review and approve it shortly.</p>
            </div>
          </div>

          {/* Preview extracted data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                AI Extracted Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-1">{extracted.name}</span></div>
                <div><span className="text-gray-500">Location:</span> <span className="font-medium ml-1">{extracted.location ?? "—"}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Designation:</span> <span className="font-medium ml-1">{extracted.designation ?? "—"}</span></div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Extracted Skills ({(extracted.skills ?? []).length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {(extracted.skills ?? []).map((s) => (
                    <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} />
                  ))}
                </div>
              </div>

              {(extracted.inferredSkills ?? []).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Inferred Skills <Badge variant="secondary" className="ml-1 text-xs">auto-detected</Badge>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(extracted.inferredSkills ?? []).map((s) => (
                      <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} inferred />
                    ))}
                  </div>
                </div>
              )}

              {(extracted.projects ?? []).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Projects ({extracted.projects.length})</p>
                  {extracted.projects.map((p, i) => (
                    <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 mb-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
