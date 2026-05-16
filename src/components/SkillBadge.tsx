import { cn, proficiencyColor, categoryColor } from "@/lib/utils";

interface SkillBadgeProps {
  name: string;
  category?: string;
  proficiency?: string;
  yearsExp?: number;
  inferred?: boolean;
  size?: "sm" | "md";
}

export default function SkillBadge({ name, category, proficiency, yearsExp, inferred, size = "md" }: SkillBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        proficiency ? proficiencyColor(proficiency) : (category ? categoryColor(category) : "bg-gray-100 text-gray-700 border-gray-200")
      )}
    >
      <span className="font-medium">{name}</span>
      {yearsExp !== undefined && (
        <span className="opacity-70">{yearsExp}yr</span>
      )}
      {inferred && (
        <span className="opacity-60 text-xs" title="Inferred skill">~</span>
      )}
    </div>
  );
}
