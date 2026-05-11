"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, History, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "DASH", icon: Home },
  { href: "/log", label: "LOG", icon: Plus },
  { href: "/history", label: "HIST", icon: History },
  { href: "/settings", label: "YOU", icon: User },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card)]/95 backdrop-blur-xl border-t border-[var(--border)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex justify-around items-center h-[72px] max-w-md mx-auto px-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all duration-200 ${active ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:scale-95"}`}>
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className="text-[10px] font-semibold tracking-[1.5px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
