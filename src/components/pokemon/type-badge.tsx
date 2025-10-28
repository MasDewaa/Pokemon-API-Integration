import { Badge } from "@/components/ui/badge";
import { getTypeColors } from "@/constants/type-colors";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const { base, soft } = getTypeColors(type);

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-none px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        className
      )}
      style={{
        background: soft,
        color: base,
      }}
    >
      {type}
    </Badge>
  );
}
