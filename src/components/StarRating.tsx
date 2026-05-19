import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "sm",
  className = "",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const interactive = !!onChange;
  const sizeCls = { xs: "h-3 w-3", sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={cn(interactive && "cursor-pointer transition-transform hover:scale-110", !interactive && "cursor-default")}
            aria-label={`${n} star`}
          >
            <Star
              className={cn(
                sizeCls,
                filled ? "fill-accent text-accent" : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
