"use client";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api";
import { Users, Scale, Flame, Dumbbell, TrendingUp, UserCheck, Activity, BarChart3, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function StatCard({ label, value, sub, icon: Icon, color = "var(--primary)" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string;
}) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] hover:border-[var(--primary)]/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-3xl font-extrabold font-[family-name:var(--font-anybody)] tracking-tight" style={{ color }}>{value}</div>
      {sub && <p className="text-[11px] text-[var(--muted-foreground)] mt-1">{sub}</p>}
    </div>
  );
}

function GoalBar({ goal, count, total }: { goal: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors: Record<string, string> = { "Lean Bulk": "#D4FF00", "Aggressive Bulk": "#FF7744", "Recomp": "#AA77FF" };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--muted-foreground)] w-28 shrink-0">{goal}</span>
      <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: colors[goal] || "#6B6B75" }} />
      </div>
      <span className="text-xs font-semibold text-[var(--foreground)] w-8 text-right">{count}</span>
    </div>
  );
}

function UserRow({ user }: { user: any }) {
  const totalLogs = Number(user.weight_count || 0) + Number(user.calorie_count || 0) + Number(user.workout_count || 0);
  const lastActive = user.last_active ? new Date(user.last_active) : null;
  const daysAgo = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : null;

  return (
    <Link href={`/admin/users/${user.id}`}
      className="flex items-center gap-4 py-3.5 px-4 bg-[var(--card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/20 transition-all active:scale-[0.99]">
      <div className="w-9 h-9 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] text-xs font-bold">
        {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)] truncate">{user.name || user.email}</span>
          {user.goal && <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-md">{user.goal}</span>}
        </div>
        <span className="text-[11px] text-[var(--muted-foreground)]">{user.email}</span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-[var(--foreground)]">{totalLogs}</div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          {daysAgo === null ? "never" : daysAgo === 0 ? "today" : daysAgo + "d ago"}
        </div>
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: admin.stats });
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => admin.users({ limit: 20, search: search || undefined }),
  });

  if (statsLoading) return (
    <div className="space-y-4 animate-fade-in">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--card)] rounded-2xl animate-pulse" />)}
    </div>
  );

  const s = stats;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">Overview</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s?.users?.total || 0} sub={`+${s?.users?.signups7d || 0} this week`} icon={Users} />
        <StatCard label="Active (7d)" value={s?.users?.active7d || 0} sub={`${s?.users?.total ? Math.round((s.users.active7d / s.users.total) * 100) : 0}% of total`} icon={Activity} color="#00E676" />
        <StatCard label="Onboarded" value={s?.users?.withProfiles || 0} sub={`${s?.users?.total ? Math.round((s.users.withProfiles / s.users.total) * 100) : 0}% conversion`} icon={UserCheck} color="#3388FF" />
        <StatCard label="Recommendations" value={s?.recommendations?.total || 0} icon={BarChart3} color="#FFAB00" />
      </div>

      {/* Log stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Weight Logs" value={s?.logs?.weight || 0} icon={Scale} color="#D4FF00" />
        <StatCard label="Calorie Logs" value={s?.logs?.calories || 0} icon={Flame} color="#FF7744" />
        <StatCard label="Workouts" value={s?.logs?.workouts || 0} icon={Dumbbell} color="#3388FF" />
      </div>

      {/* Goal distribution */}
      {s?.goalDistribution?.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-4">Goal Distribution</h3>
          <div className="space-y-3">
            {s.goalDistribution.map((g: any) => (
              <GoalBar key={g.goal} goal={g.goal} count={Number(g.count)} total={s.users.withProfiles} />
            ))}
          </div>
        </div>
      )}

      {/* Signup trend */}
      {s?.signupsByDay?.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-4">Signups (30d)</h3>
          <div className="flex items-end gap-1 h-20">
            {s.signupsByDay.map((d: any, i: number) => {
              const max = Math.max(...s.signupsByDay.map((x: any) => Number(x.count)));
              const pct = max > 0 ? (Number(d.count) / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                  <div className="w-full bg-[var(--primary)]/20 rounded-sm hover:bg-[var(--primary)]/40 transition-colors" style={{ height: Math.max(pct, 4) + "%" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">Users</h3>
          <span className="text-sm text-[var(--muted-foreground)]">{usersData?.total || 0} total</span>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full bg-[var(--card)] text-[var(--foreground)] text-sm pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] outline-none placeholder:text-[var(--muted-foreground)]" />
        </div>
        {usersLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-[var(--card)] rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {(usersData?.users || []).map((u: any) => <UserRow key={u.id} user={u} />)}
          </div>
        )}
      </div>
    </div>
  );
}
