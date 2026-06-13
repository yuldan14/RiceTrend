"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GitCompareArrows, History, TrendingUp } from "lucide-react";
import { cn } from "@/utils/style";

const mobileItems = [
  { label: "Overview", href: "/", icon: BarChart3 },
  { label: "Prediksi", href: "/prediksi-harga", icon: TrendingUp },
  { label: "Model", href: "/perbandingan-model", icon: GitCompareArrows },
  { label: "Historis", href: "/data-historis", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-4 border-t border-border bg-white/95 px-2 backdrop-blur md:hidden"
      aria-label="Navigasi utama"
    >
      {mobileItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted transition",
              active && "text-brand-700",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
