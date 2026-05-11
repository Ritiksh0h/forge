"use client";
import { useState } from "react";
import { formatTime } from "@/lib/utils";
import { Scale, Flame, Dumbbell, X } from "lucide-react";
import type { HistoryEntry } from "@/types";
import type { LucideIcon } from "lucide-react";

function EntryRow({ entry, onDelete }: { entry: HistoryEntry; onDelete: (type: string, id: string) => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const iconMap: Record<string, LucideIcon> = { weight: Scale, calories: Flame, workout: Dumbbell };
  const iconColors: Record<string, string> = { weight: "text-[var(--primary)]", calories: "text-[#FF7744]", workout: "text-[#3388FF]" };
  const Icon = iconMap[entry.type] || Scale;

  return (
    <div className="flex items-center gap-4 py-4 px-4 bg-[var(--card)] rounded-2xl animate-slide-in transition-all duration-200 hover:bg-[#151517]"
      onClick={() => confirmDel && setConfirmDel(false)}>
      <div className={`w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center ${iconColors[entry.type]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[15px] text-[var(--foreground)] font-medium block">
          {entry.type === "workout" ? entry.exercises?.map(x => x.name).join(", ") || "Workout" : entry.value + " " + (entry.type === "weight" ? "lbs" : "cal")}
        </span>
        {entry.type === "workout" && entry.exercises && (
          <span className="text-[11px] text-[var(--muted-foreground)] block truncate">{entry.exercises.map(x => x.weight + "×" + x.reps).join(" · ")}</span>
        )}
        {entry.type !== "workout" && <span className="text-[11px] text-[var(--muted-foreground)]">{formatTime(entry.loggedAt)}</span>}
      </div>
      <button onClick={(e) => { e.stopPropagation(); confirmDel ? (onDelete(entry.type, entry.id), setConfirmDel(false)) : setConfirmDel(true); }}
        className={`flex items-center justify-center transition-all duration-200 ${confirmDel
          ? "bg-[var(--destructive)]/10 text-[var(--destructive)] border border-[var(--destructive)]/30 px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide"
          : "w-8 h-8 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"}`}>
        {confirmDel ? "DELETE" : <X className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function EntryList({ entries, onDelete }: { entries: HistoryEntry[]; onDelete: (type: string, id: string) => void }) {
  if (!entries.length) return <div className="text-center py-16 text-[var(--muted-foreground)] text-sm">Nothing here yet.</div>;
  return (
    <div className="space-y-3">
      {entries.map((e, i) => (
        <div key={e.id} style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}>
          <EntryRow entry={e} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
