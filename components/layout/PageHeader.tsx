import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  breadcrumb?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb = "RiceTrend",
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border bg-white px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
      <div>
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted">
          <span>{breadcrumb}</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-brand-700">{title}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export default PageHeader;
