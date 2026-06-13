import type { ReactNode } from "react";
import { ArrowUp, Sprout } from "lucide-react";
import { cn } from "@/utils/style";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  arrow?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  arrow = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center text-center", className)}>
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        {icon ?? <Sprout className="h-8 w-8" aria-hidden="true" />}
        {arrow && (
          <ArrowUp
            className="absolute -top-7 h-5 w-5 animate-bounce text-brand-600"
            aria-hidden="true"
          />
        )}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
