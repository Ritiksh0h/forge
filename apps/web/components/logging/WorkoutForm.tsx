"use client";
import { useState } from "react";
import { Check, X, Scale, Flame, Dumbbell } from "lucide-react";

interface Ex { name: string; weight: string; reps: string; sets: string; }
const LIFTS = ["Bench", "Squat", "Deadlift", "OHP", "Row", "Pull-up"];

export function WorkoutForm({ onSubmit, isPending }: { onSubmit: (exs: any[]) => Promise<any>; isPending: boolean }) {
  const [exs, setExs] = useState<Ex[]>([{ name: "", weight: "", reps: "", sets: "" }]);
  const [flash, setFlash] = useState("");

  const update = (i: number, field: keyof Ex, val: string) => {
    const c = [...exs]; c[i] = { ...c[i], [field]: val }; setExs(c);
  };
  const addLift = (name: string) => {
    const idx = exs.findIndex(e => !e.name);
    if (idx >= 0) { const c = [...exs]; c[idx] = { ...c[idx], name }; setExs(c); }
    else setExs([...exs, { name, weight: "", reps: "", sets: "" }]);
  };
  const handle = async () => {
    const valid = exs.filter(e => e.name && e.weight && e.reps);
    if (!valid.length) return;
    await onSubmit(valid.map(e => ({ name: e.name, weight: Number(e.weight), reps: Number(e.reps), sets: Number(e.sets) || 1 })));
    setFlash(valid.length + " lift(s)");
    setExs([{ name: "", weight: "", reps: "", sets: "" }]);
    setTimeout(() => setFlash(""), 2000);
  };

  const inp = "flex-1 bg-[var(--secondary)] text-[var(--foreground)] text-sm px-3 py-3 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] outline-none text-center placeholder:text-[var(--muted-foreground)]";

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 animate-fade-in">
      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-xl mb-4 text-[#00E676] text-sm font-medium">
          <Check className="w-4 h-4" /> {flash} logged
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {LIFTS.map(l => (
          <button key={l} onClick={() => addLift(l)}
            className="px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--muted-foreground)] text-xs hover:border-[var(--primary)]/30 active:scale-95 transition-all">
            {l}
          </button>
        ))}
      </div>

      {exs.map((ex, i) => (
        <div key={i} className="bg-[var(--secondary)] rounded-xl p-4 mb-3 animate-slide-in" style={{ animationDelay: i * 50 + "ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <input value={ex.name} onChange={e => update(i, "name", e.target.value)} placeholder="Exercise"
              className="flex-1 bg-transparent text-[var(--foreground)] text-sm outline-none placeholder:text-[var(--muted-foreground)]" />
            {exs.length > 1 && (
              <button onClick={() => setExs(exs.filter((_, j) => j !== i))}
                className="w-8 h-8 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input value={ex.weight} onChange={e => update(i, "weight", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="lbs" inputMode="decimal" className={inp} />
            <input value={ex.reps} onChange={e => update(i, "reps", e.target.value.replace(/[^0-9]/g, ""))} placeholder="reps" inputMode="numeric" className={inp} />
            <input value={ex.sets} onChange={e => update(i, "sets", e.target.value.replace(/[^0-9]/g, ""))} placeholder="sets" inputMode="numeric" className={inp} />
          </div>
        </div>
      ))}

      <button onClick={() => setExs([...exs, { name: "", weight: "", reps: "", sets: "" }])}
        className="w-full py-3 border border-dashed border-[var(--border)] rounded-xl text-[var(--muted-foreground)] text-xs mb-3 hover:border-[var(--primary)]/30 transition-colors">
        + Add Exercise
      </button>

      <button onClick={handle} disabled={!exs.some(e => e.name && e.weight && e.reps) || isPending}
        className="w-full mt-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-4 rounded-xl text-sm tracking-wide font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-35">
        LOG WORKOUT
      </button>
    </div>
  );
}
