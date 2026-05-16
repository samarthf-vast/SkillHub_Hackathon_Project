"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Loader2, Eye, EyeOff, Sparkles, Users, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password"); setLoading(false); }
    else { router.push("/"); router.refresh(); }
  };

  const features = [
    { icon: Sparkles, label: "AI Resume Extraction", desc: "Auto-extract skills from any PDF" },
    { icon: Search, label: "Semantic Search", desc: "Natural language talent discovery" },
    { icon: Users, label: "Skills Intelligence", desc: "Know your team's full capabilities" },
    { icon: Shield, label: "Role-Based Access", desc: "Separate HR & Employee views" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">SkillsHub</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Find the right people,<br />
              <span className="text-indigo-200">every time.</span>
            </h1>
            <p className="mt-4 text-lg text-indigo-200">
              AI-powered skills intelligence platform that understands your team the way humans do.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-indigo-200 mb-2" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-indigo-300">Built for the SkillsHub Hackathon 2026</p>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="rounded-xl bg-indigo-600 p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SkillsHub</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11" />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            No account?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
