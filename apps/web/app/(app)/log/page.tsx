"use client";
import { useState } from "react";
import { useLog } from "@/hooks/useLog";
import { useDashboard } from "@/hooks/useDashboard";
import { WeightForm } from "@/components/logging/WeightForm";
import { CalorieForm } from "@/components/logging/CalorieForm";
import { WorkoutForm } from "@/components/logging/WorkoutForm";
import { Scale, Flame, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function LogTab({ type, active, onClick, icon: Icon }: { type: string; active: boolean; onClick: () => void; icon: LucideIcon }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-semibold tracking-[1.5px] uppercase rounded-xl transition-all duration-200 ${active
        ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
        : "text-[var(--muted-foreground)] border border-transparent hover:border-[var(--border)] active:scale-95"}`}>
      <Icon className="w-4 h-4" />{type}
    </button>
  );
}

export default function LogPage() {
  const [tab, setTab] = useState<"weight" | "cals" | "workout">("weight");
  const { logWeight, logCalories, logWorkout, isLogging } = useLog();
  const { recommendation } = useDashboard();

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">Log Entry</h1>
      <div className="flex gap-3">
        <LogTab type="Weight" active={tab === "weight"} onClick={() => setTab("weight")} icon={Scale} />
        <LogTab type="Cals" active={tab === "cals"} onClick={() => setTab("cals")} icon={Flame} />
        <LogTab type="Lift" active={tab === "workout"} onClick={() => setTab("workout")} icon={Dumbbell} />
      </div>
      {tab === "weight" && <WeightForm onSubmit={logWeight} isPending={isLogging} />}
      {tab === "cals" && <CalorieForm onSubmit={logCalories} isPending={isLogging} target={recommendation?.tdee?.target} />}
      {tab === "workout" && <WorkoutForm onSubmit={logWorkout} isPending={isLogging} />}
    </div>
  );
}
