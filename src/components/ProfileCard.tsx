import Link from "next/link";
import { MapPin, Briefcase, Building2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import SkillBadge from "./SkillBadge";
import type { EmployeeWithDetails } from "@/types";

interface Props {
  employee: EmployeeWithDetails;
  linkPrefix?: string;
}

export default function ProfileCard({ employee, linkPrefix = "/hr/employees" }: Props) {
  const topSkills = employee.skills.slice(0, 4);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-5">
        <Link href={`${linkPrefix}/${employee.id}`} className="block">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
              {employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                {employee.designation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />{employee.designation}
                  </span>
                )}
                {employee.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{employee.location}
                  </span>
                )}
                {employee.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />{employee.department}
                  </span>
                )}
              </div>
            </div>
            {employee.currentProject ? (
              <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                Allocated
              </span>
            ) : (
              <span className="flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
                Available
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {topSkills.map((s) => (
              <SkillBadge key={s.skill.name} name={s.skill.name} proficiency={s.proficiency} size="sm" />
            ))}
            {employee.skills.length > 4 && (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                +{employee.skills.length - 4}
              </span>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
