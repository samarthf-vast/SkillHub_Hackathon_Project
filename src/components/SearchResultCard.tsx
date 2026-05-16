import { MapPin, Briefcase, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import SkillBadge from "./SkillBadge";
import { scoreColor, scoreBarColor, parseTechStack } from "@/lib/utils";
import type { SearchResult } from "@/types";
import Link from "next/link";

interface Props {
  result: SearchResult;
  rank: number;
}

export default function SearchResultCard({ result, rank }: Props) {
  const { employee, matchScore, reasoning } = result;
  const topSkills = employee.skills.slice(0, 5);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex">
          {/* Match score sidebar */}
          <div className="flex w-20 flex-col items-center justify-center bg-gray-50 px-3 py-4 border-r border-gray-100">
            <span className="text-xs font-medium text-gray-400 mb-1">#{rank}</span>
            <span className={`text-2xl font-bold ${scoreColor(matchScore)}`}>{matchScore}</span>
            <span className="text-xs text-gray-400">match</span>
            <div className="mt-2 w-full">
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1.5 rounded-full ${scoreBarColor(matchScore)} transition-all`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/hr/employees/${employee.id}`} className="text-base font-semibold text-gray-900 hover:text-indigo-600">
                  {employee.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500">
                  {employee.designation && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {employee.designation}
                    </span>
                  )}
                  {employee.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {employee.location}
                    </span>
                  )}
                </div>
              </div>
              {employee.currentProject ? (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                  On: {employee.currentProject}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
                  Unallocated
                </span>
              )}
            </div>

            {/* AI Reasoning */}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
              <p className="text-sm text-indigo-800">{reasoning}</p>
            </div>

            {/* Skills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topSkills.map((s) => (
                <SkillBadge
                  key={s.skill.name}
                  name={s.skill.name}
                  proficiency={s.proficiency}
                  yearsExp={s.yearsExp}
                  inferred={s.inferred}
                  size="sm"
                />
              ))}
              {employee.skills.length > 5 && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  +{employee.skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
