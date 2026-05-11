"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, auth } from "@/lib/api";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    auth.me().then((data: any) => {
      if (data.user?.role === "admin") setAllowed(true);
      else router.replace("/dashboard");
    }).catch(() => router.replace("/login")).finally(() => setChecking(false));
  }, [router]);

  if (checking) return <div className="min-h-screen bg-[var(--background)]" />;
  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--destructive)]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--destructive)]" />
            </div>
            <span className="font-extrabold text-lg text-[var(--foreground)] font-[family-name:var(--font-anybody)]">FORGE</span>
            <span className="text-[10px] text-[var(--destructive)] bg-[var(--destructive)]/10 px-2 py-1 rounded-md font-semibold tracking-widest">ADMIN</span>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> App
          </Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  );
}
