"use client";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api";
import { useParams } from "next/navigation";
import { ArrowLeft, Scale, Flame, Dumbbell, TrendingUp, TrendingDown, Minus, ClipboardCheck } from "lucide-react";
import Link from "next/link";

function Tag({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--secondary)] rounded-lg px-3 py-2">
      <span className="text-[9px] font-semibold tracking-[1.5px] text-[var(--muted-foreground)] uppercase block">{label}</span>
      <span className="text-sm font-semibold block mt-0.5" style={{ color: color || "var(--foreground)" }}>{value}</span>
    </div>
  );
}

function EngineCard({ rec }: { rec: any }) {
  if (!rec) return <div className="bg-[var(--card)] rounded-2xl p-5 text-[var(--muted-foreground)] text-sm">No engine data (no profile or logs)</div>;
  if (rec.error) return <div className="bg-[var(--card)] rounded-2xl p-5 text-[var(--destructive)] text-sm">Engine error: {rec.error}</div>;

  const statusColor = rec.status === "on_track" ? "#00E676" : rec.status === "off_track" ? "#FF4455" : "#D4FF00";
  const confColor = rec.confidence === "high" ? "#00E676" : rec.confidence === "medium" ? "#FFAB00" : "#6B6B75";
  const TrendIcon = (t: string) => t === "up" || t === "good_gain" ? TrendingUp : t === "down" || t === "losing" ? TrendingDown : Minus;
  const WIcon = TrendIcon(rec.weightTrend);
  const SIcon = TrendIcon(rec.strengthTrend);

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">Live Engine Output</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border" style={{ color: statusColor, borderColor: statusColor + "33", background: statusColor + "15" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
          {rec.statusLabel || rec.status}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border" style={{ color: confColor, borderColor: confColor + "33", background: confColor + "15" }}>
          {rec.confidence}
        </span>
        {rec.isCalibrating && <span className="px-3 py-1.5 rounded-full text-[10px] font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">CALIBRATING</span>}
      </div>

      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{rec.reason}</p>
      {rec.confidenceReason && <p className="text-[11px] text-[var(--text-tertiary)]">{rec.confidenceReason}</p>}

      <div className="border-l-[3px] border-[var(--primary)] pl-4 py-2 bg-[var(--primary)]/5 rounded-r-xl">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase block mb-1">Calories</span>
        <span className="text-base font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{rec.calorieAction}</span>
      </div>
      <div className="border-l-[3px] border-[#3388FF] pl-4 py-2 bg-[#3388FF]/5 rounded-r-xl">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase block mb-1">Training</span>
        <span className="text-base font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{rec.workoutAction}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Tag label="Weight" value={rec.avgWeight ? rec.avgWeight.toFixed(1) : "—"} />
        <Tag label="Calories" value={rec.avgCalories ? Math.round(rec.avgCalories).toString() : "—"} />
        <Tag label="Delta" value={rec.delta !== null ? (rec.delta > 0 ? "+" : "") + rec.delta.toFixed(1) : "—"} color={rec.delta > 0 ? "#00E676" : rec.delta < 0 ? "#FF4455" : undefined} />
        <Tag label="W. Trend" value={rec.weightTrend || "unknown"} />
        <Tag label="S. Trend" value={rec.strengthTrend || "unknown"} />
        <Tag label="Adherence" value={rec.adherence ? rec.adherence.pct + "%" : "—"} color={rec.adherence?.pct >= 70 ? "#00E676" : rec.adherence?.pct >= 40 ? "#FFAB00" : "#FF4455"} />
      </div>
    </div>
  );
}

function LogTimeline({ label, logs, renderItem }: { label: string; logs: any[]; renderItem: (l: any) => React.ReactNode }) {
  if (!logs.length) return null;
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
      <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-3">{label}</h3>
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {logs.map((l: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-[var(--secondary)] rounded-lg text-sm">
            {renderItem(l)}
            <span className="text-[11px] text-[var(--muted-foreground)] shrink-0">{new Date(l.loggedAt || l.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => admin.user(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-[var(--card)] rounded-2xl animate-pulse" />)}</div>;
  if (error || !data) return <div className="text-[var(--destructive)]">Failed to load user</div>;

  const { user, profile: p, totals, recentLogs, recentCheckins, recommendations: recs, engineResult } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* User header */}
      <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--secondary)] flex items-center justify-center text-xl font-bold text-[var(--muted-foreground)]">
            {(p?.name || user.email)?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{p?.name || "No profile"}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-md">{user.role}</span>
              {user.googleId && <span className="text-[10px] text-[#3388FF] bg-[#3388FF]/10 px-2 py-0.5 rounded-md">Google</span>}
              <span className="text-[10px] text-[var(--muted-foreground)]">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {p && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            <Tag label="Goal" value={p.goal} color="#D4FF00" />
            <Tag label="Gender" value={p.gender || "—"} />
            <Tag label="Age" value={p.age ? String(p.age) : "—"} />
            <Tag label="Height" value={p.height ? p.height + '"' : "—"} />
            <Tag label="Weight" value={p.weight ? p.weight + " lbs" : "—"} />
            <Tag label="Activity" value={p.activity || "—"} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-[var(--secondary)] rounded-xl">
            <Scale className="w-4 h-4 text-[var(--primary)] mx-auto mb-1" />
            <div className="text-lg font-bold font-[family-name:var(--font-anybody)] text-[var(--foreground)]">{totals.weight}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">weight logs</div>
          </div>
          <div className="text-center p-3 bg-[var(--secondary)] rounded-xl">
            <Flame className="w-4 h-4 text-[#FF7744] mx-auto mb-1" />
            <div className="text-lg font-bold font-[family-name:var(--font-anybody)] text-[var(--foreground)]">{totals.calories}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">calorie logs</div>
          </div>
          <div className="text-center p-3 bg-[var(--secondary)] rounded-xl">
            <Dumbbell className="w-4 h-4 text-[#3388FF] mx-auto mb-1" />
            <div className="text-lg font-bold font-[family-name:var(--font-anybody)] text-[var(--foreground)]">{totals.workouts}</div>
            <div className="text-[10px] text-[var(--muted-foreground)]">workouts</div>
          </div>
        </div>
      </div>

      {/* Engine output */}
      <EngineCard rec={engineResult} />

      {/* Recommendation history */}
      {recs?.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-3">Recommendation History</h3>
          <div className="space-y-2">
            {recs.map((r: any, i: number) => {
              const c = r.status === "on_track" ? "#00E676" : r.status === "off_track" ? "#FF4455" : "#D4FF00";
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 bg-[var(--secondary)] rounded-xl">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--foreground)] font-medium">{r.weekKey}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)] block truncate">{r.calorieAction}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase" style={{ color: c }}>{r.statusLabel || r.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LogTimeline label="Recent Weight" logs={recentLogs.weight} renderItem={l => <span className="text-[var(--primary)] font-semibold">{l.value} lbs</span>} />
        <LogTimeline label="Recent Calories" logs={recentLogs.calories} renderItem={l => <span className="text-[#FF7744] font-semibold">{l.value} cal</span>} />
      </div>

      {recentLogs.workouts?.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-3">Recent Workouts</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentLogs.workouts.map((w: any, i: number) => (
              <div key={i} className="py-2.5 px-3 bg-[var(--secondary)] rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#3388FF] font-medium">{w.exercises?.map((e: any) => e.name).join(", ") || "Workout"}</span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{new Date(w.loggedAt || w.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                {w.exercises?.length > 0 && (
                  <span className="text-[11px] text-[var(--muted-foreground)]">{w.exercises.map((e: any) => `${e.weight}×${e.reps}×${e.sets}`).join(" · ")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-ins */}
      {recentCheckins?.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)]">
          <h3 className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase mb-3">Recent Check-ins</h3>
          <div className="flex flex-wrap gap-2">
            {recentCheckins.map((c: any, i: number) => (
              <span key={i} className="text-[11px] px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-[var(--muted-foreground)]">
                {c.type}: <span className="text-[var(--foreground)] font-medium">{c.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
