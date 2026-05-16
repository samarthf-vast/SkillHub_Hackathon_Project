"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword: "placeholder_check" }),
    });
    setLoading(false);
    // If email not found it returns 404
    if (res.status === 404) {
      setError("No account found with this email address.");
      return;
    }
    // Otherwise (even 400 for short password is fine — email exists)
    setStep("reset");
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Reset failed"); return; }
    setStep("done");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-xl bg-indigo-600 p-2">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">SkillsHub</span>
        </div>

        {step === "email" && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
            <p className="mt-1 text-sm text-gray-500">Enter your account email to reset your password.</p>
            <form onSubmit={checkEmail} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
                <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Checking...</> : "Continue"}
              </Button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
            <p className="mt-1 text-sm text-gray-500">Create a new password for <span className="font-medium text-gray-700">{email}</span></p>
            <form onSubmit={resetPassword} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">New password</label>
                <div className="relative">
                  <Input type={showPwd ? "text" : "password"} placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm new password</label>
                <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting...</> : "Reset Password"}
              </Button>
              <button type="button" onClick={() => setStep("email")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mx-auto">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
            <p className="mt-2 text-sm text-gray-500">Your password has been updated successfully. You can now sign in with your new password.</p>
            <Link href="/login">
              <Button className="mt-6 w-full h-11">Back to Sign In</Button>
            </Link>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign in →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
