import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTechStack(techStack: string): string[] {
  try { return JSON.parse(techStack); } catch { return [techStack]; }
}

export function proficiencyColor(proficiency: string): string {
  const map: Record<string, string> = {
    EXPERT: "bg-emerald-100 text-emerald-800 border-emerald-200",
    INTERMEDIATE: "bg-blue-100 text-blue-800 border-blue-200",
    NOVICE: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return map[proficiency] ?? "bg-gray-100 text-gray-800";
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    LANGUAGE: "bg-purple-100 text-purple-800",
    FRAMEWORK: "bg-indigo-100 text-indigo-800",
    PLATFORM: "bg-cyan-100 text-cyan-800",
    TOOL: "bg-orange-100 text-orange-800",
    DOMAIN: "bg-rose-100 text-rose-800",
  };
  return map[category] ?? "bg-gray-100 text-gray-800";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-gray-500";
}

export function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-gray-400";
}
