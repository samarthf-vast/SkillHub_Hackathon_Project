"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Brain, Users, Search, ClipboardCheck, User, Upload, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const isHR = user?.role === "HR";

  const hrLinks = [
    { href: "/hr/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/hr/search", label: "Search Talent", icon: Search },
    { href: "/hr/employees", label: "Directory", icon: Users },
    { href: "/hr/review-queue", label: "Review Queue", icon: ClipboardCheck },
  ];

  const empLinks = [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/profile", label: "My Profile", icon: User },
    { href: "/employee/upload", label: "Upload Resume", icon: Upload },
  ];

  const links = isHR ? hrLinks : empLinks;
  const initials = (user?.name ?? "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-14">
        {/* Logo */}
        <Link href={isHR ? "/hr/dashboard" : "/employee/dashboard"} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 shadow-sm">
            <Brain className="h-4.5 w-4.5 text-white h-5 w-5" />
          </div>
          <span className="text-base font-bold text-gray-900">SkillsHub</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", isHR ? "bg-violet-100 text-violet-700" : "bg-indigo-100 text-indigo-700")}>
            {isHR ? "HR" : "Employee"}
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 bg-gray-50">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", isHR ? "bg-violet-500" : "bg-indigo-500")}>
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name?.split(" ")[0] ?? "User"}</p>
              <p className="text-xs text-gray-400 leading-tight truncate max-w-[120px]">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-200"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
