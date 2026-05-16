"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Props {
  employeeId: string;
  onExtracted: (data: any, profileId: string) => void;
}

export default function ResumeUploader({ employeeId, onExtracted }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };

  const upload = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("employeeId", employeeId);

      const res = await fetch("/api/resume/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setStatus("success");
      onExtracted(data.extracted, data.profileId);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
        )}
      >
        {file ? (
          <>
            <FileText className="h-10 w-10 text-indigo-500 mb-3" />
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="font-medium text-gray-900">Drop your resume here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse — PDF only</p>
          </>
        )}
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Resume extracted successfully! Review the data below.
        </div>
      )}

      {file && status !== "success" && (
        <Button onClick={upload} disabled={status === "uploading"} className="w-full">
          {status === "uploading" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Extracting with AI...</>
          ) : (
            <><Upload className="h-4 w-4" /> Extract Skills from Resume</>
          )}
        </Button>
      )}
    </div>
  );
}
