"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";
import { Nav } from "@/components/ui/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated()) router.replace("/login"); }, [router]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-md mx-auto px-5 pt-8">
        {children}
      </div>
      <Nav />
    </main>
  );
}
