"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { profile, clearToken } from "@/lib/api";
import { User, LogOut, ChevronRight } from "lucide-react";

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between w-full py-3 group">
      <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--foreground)]">{value}</span>
        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => profile.get() });
  const p = data?.profile;

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">Profile</h1>

      {p && (
        <div className="bg-[var(--card)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center">
              <User className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{p.name || "—"}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{p.goal}</p>
            </div>
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div className="space-y-1">
            <SettingsRow label="Goal" value={p.goal} />
            <SettingsRow label="Gender" value={p.gender || "—"} />
            <SettingsRow label="Age" value={p.age ? String(p.age) : "—"} />
            <SettingsRow label="Height" value={p.height ? p.height + " in" : "—"} />
            <SettingsRow label="Weight" value={p.weight ? p.weight + " lbs" : "—"} />
            <SettingsRow label="Activity" value={p.activity || "—"} />
            <SettingsRow label="Experience" value={p.experience || "—"} />
          </div>
        </div>
      )}

      <button onClick={() => { clearToken(); router.push("/login"); }}
        className="w-full flex items-center justify-center gap-3 bg-[var(--secondary)] text-[var(--destructive)] font-semibold py-4 rounded-xl text-sm tracking-wide border border-[var(--border)] hover:bg-[var(--destructive)]/10 hover:border-[var(--destructive)]/30 active:scale-[0.98] transition-all duration-200">
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </div>
  );
}
