"use client";
import { useState } from "react";
import { Check } from "lucide-react";

export function CalorieForm({ onSubmit, isPending, target }: { onSubmit: (v: number) => Promise<any>; isPending: boolean; target?: number }) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [flash, setFlash] = useState("");
  const options = target ? [-200, -100, 0, 100, 200].map(o => target + o) : [1800, 2200, 2500, 2800, 3200];

  const handle = async () => {
    if (!value) return;
    await onSubmit(Number(value));
    setFlash(value + " cal");
    setValue(""); setSelected(null);
    setTimeout(() => setFlash(""), 2000);
  };

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 animate-fade-in">
      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-xl mb-4 text-[#00E676] text-sm font-medium">
          <Check className="w-4 h-4" /> {flash} logged
        </div>
      )}
      <div className="flex gap-2 justify-center flex-wrap mb-5">
        {options.map(v => (
          <button key={v} onClick={() => { setSelected(v); setValue(String(v)); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${selected === v
              ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 scale-105"
              : "bg-[var(--secondary)] text-[var(--muted-foreground)] border border-transparent hover:border-[var(--border)] active:scale-95"}`}>
            {v.toLocaleString()}
          </button>
        ))}
      </div>
      <input value={value} onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="Enter calories..." inputMode="numeric"
        onKeyDown={e => e.key === "Enter" && value && handle()}
        className="w-full bg-[var(--secondary)] text-[var(--foreground)] text-lg px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none" />
      <button onClick={handle} disabled={!value || isPending}
        className="w-full mt-5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-4 rounded-xl text-sm tracking-wide font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-35">
        LOG CALORIES
      </button>
    </div>
  );
}
