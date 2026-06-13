import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiceTrend - Prediksi Harga Beras",
  description: "Dashboard analitik dan prediksi harga beras Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-surface font-sans antialiased">
        <AppShell>{children}</AppShell>
        <ToastProvider />
      </body>
    </html>
  );
}
