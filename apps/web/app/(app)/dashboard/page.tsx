"use client";
import { useDashboard } from "@/hooks/useDashboard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { AdherenceRing } from "@/components/dashboard/AdherenceRing";
import { TrendIndicators } from "@/components/dashboard/TrendIndicators";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { Sparkline } from "@/components/ui/Chart";
import { StatusBadge, mapStatus } from "@/components/ui/Badge";
import { Zap } from "lucide-react";

export default function DashboardPage() {
  const { recommendation: rec, weightChart, calorieChart, pastRecommendations, checkIn, profile, isLoading, error, refetchCheckIn, refetch } = useDashboard();

  if (isLoading) return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[var(--card)] rounded-2xl animate-pulse" />)}
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <p className="text-[var(--destructive)] text-sm mb-3">Failed to load dashboard</p>
      <button onClick={() => refetch()} className="text-[var(--primary)] text-sm underline">Retry</button>
    </div>
  );
  if (!rec) return <div className="flex items-center justify-center h-[60vh] text-[var(--muted-foreground)] text-sm">No data yet. Start logging.</div>;

  const lastWeight = weightChart.length ? weightChart[weightChart.length - 1].value : null;
  const lastCal = calorieChart.length ? calorieChart[calorieChart.length - 1].value : null;

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mt-1">
            Hey, {profile?.name || "Lifter"}
          </h1>
          {rec.streak >= 2 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-4 h-4 text-[#FFAB00]" />
              <span className="text-[13px] text-[var(--muted-foreground)]">{rec.streak} day streak</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <span className="text-[var(--primary-foreground)] font-extrabold text-sm font-[family-name:var(--font-anybody)]">F</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[var(--foreground)] font-[family-name:var(--font-anybody)]">FORGE</span>
          <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 rounded-md">V4</span>
        </div>
      </div>

      {/* Check-in */}
      {checkIn && <CheckInCard checkIn={checkIn} onComplete={() => { refetchCheckIn(); refetch(); }} />}

      {/* Recommendation */}
      <RecommendationCard rec={rec} />

      {/* Adherence & Trends */}
      <div className="bg-[var(--card)] rounded-2xl p-5 flex items-center justify-between">
        <AdherenceRing pct={rec.adherence?.pct || 0} total={rec.adherence?.total || 0} />
        <TrendIndicators weightTrend={rec.weightTrend} strengthTrend={rec.strengthTrend} />
      </div>

      {/* Stats Grid */}
      <StatsRow rec={rec} />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--card)] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">14D Weight</span>
            {lastWeight && <span className="text-sm font-semibold text-[var(--foreground)]">{lastWeight}</span>}
          </div>
          <Sparkline data={weightChart} color="#D4FF00" label="weight" />
        </div>
        <div className="bg-[var(--card)] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">14D Cals</span>
            {lastCal && <span className="text-sm font-semibold text-[var(--foreground)]">{lastCal}</span>}
          </div>
          <Sparkline data={calorieChart} color="#FF7744" label="calories" />
        </div>
      </div>

      {/* Past Recommendations */}
      {pastRecommendations.length > 0 && (
        <div className="bg-[var(--card)] rounded-2xl p-5">
          <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase block mb-4">Past Recommendations</span>
          <div className="space-y-2">
            {pastRecommendations.map((r, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-[var(--secondary)] rounded-xl">
                <div>
                  <span className="text-sm text-[var(--foreground)] font-medium block">{r.week}</span>
                  <span className="text-[11px] text-[var(--muted-foreground)]">{r.calorieAction}</span>
                </div>
                <StatusBadge status={r.status === "on_track" ? "On Track" : r.status === "off_track" ? "Off Track" : "Calibrating"} variant={mapStatus(r.status)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
