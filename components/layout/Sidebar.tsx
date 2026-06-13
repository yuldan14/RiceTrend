"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  GitCompareArrows,
  Settings,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/style";

const menuItems = [
  { label: "Overview", href: "/", icon: BarChart3 },
  { label: "Prediksi Harga", href: "/prediksi-harga", icon: TrendingUp },
  { label: "Data Historis", href: "/data-historis", icon: Database },
  { label: "Perbandingan Model", href: "/perbandingan-model", icon: GitCompareArrows },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col bg-slate-900 text-white transition-[width] duration-200 md:flex md:w-16",
        collapsed ? "lg:w-16" : "lg:w-60",
      )}
    >
      <div className="flex h-16 items-center border-b border-slate-700/70 px-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="RiceTrend overview">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Sprout className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className={cn("text-lg font-bold text-white md:hidden", !collapsed && "lg:block")}>
            RiceTrend
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-5" aria-label="Navigasi utama">
        {menuItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white",
                active && "bg-slate-800 text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-r before:bg-brand-500",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
              <span className={cn("truncate md:hidden", !collapsed && "lg:block")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-700/70 p-3">
        <div className={cn("rounded-xl bg-slate-800 p-3", collapsed && "px-2")}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
            </span>
            <span className={cn("text-xs font-medium text-slate-200 md:hidden", !collapsed && "lg:block")}>
              Auto-refresh: 5m
            </span>
          </div>
          <p className={cn("mt-2 text-[11px] text-slate-400 md:hidden", !collapsed && "lg:block")}>
            Status online
          </p>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            RT
          </span>
          <div className={cn("min-w-0 md:hidden", !collapsed && "lg:block")}>
            <p className="truncate text-xs font-semibold text-white">Rice analyst</p>
            <p className="truncate text-[11px] text-slate-400">Local data</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-card hover:text-white lg:flex"
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;
