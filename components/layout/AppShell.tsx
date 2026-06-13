"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/style";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

const appRoutes = [
  "/",
  "/prediksi-harga",
  "/data-historis",
  "/perbandingan-model",
  "/pengaturan",
];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    appRoutes.forEach((route) => router.prefetch(route));
  }, [router]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const handleNavigationCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const link = target.closest("a");

    if (
      !link ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank"
    ) {
      return;
    }

    const nextUrl = new URL(link.href, window.location.href);
    if (nextUrl.origin === window.location.origin && nextUrl.pathname !== pathname) {
      setNavigating(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface" onClickCapture={handleNavigationCapture}>
      <div
        className={cn(
          "fixed left-0 right-0 top-0 z-[100] h-0.5 origin-left bg-brand-500 opacity-0 transition-opacity",
          navigating && "animate-pulse opacity-100",
        )}
        role="progressbar"
        aria-label="Memuat halaman"
        aria-hidden={!navigating}
      />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <main
        className={cn(
          "min-h-screen pb-20 transition-[margin] duration-200 md:ml-16 md:pb-0",
          collapsed ? "lg:ml-16" : "lg:ml-60",
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default AppShell;
