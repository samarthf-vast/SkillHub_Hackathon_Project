"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Loader2, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "EMPLOYEE" | "HR";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    location: "",
    designation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        department: form.department,
        location: form.location,
        designation: form.designation,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-2xl bg-indigo-600 p-3 shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SkillsHub</h1>
          <p className="mt-1 text-gray-500">Create your account</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Role selector */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-gray-700">I am signing up as</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("EMPLOYEE")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                  role === "EMPLOYEE"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <UserCheck className="h-4 w-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => setRole("HR")}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                  role === "HR"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <Users className="h-4 w-4" />
                HR Team
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <Input placeholder="Rahul Sharma" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Work Email *</label>
                <Input type="email" placeholder="you@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>

              {role === "EMPLOYEE" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Job Title</label>
                    <Input placeholder="Frontend Engineer" value={form.designation} onChange={(e) => update("designation", e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                    <Input placeholder="Pune" value={form.location} onChange={(e) => update("location", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
                    <Input placeholder="Engineering" value={form.department} onChange={(e) => update("department", e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
                <Input type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm *</label>
                <Input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : `Create ${role === "HR" ? "HR" : "Employee"} Account`}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
