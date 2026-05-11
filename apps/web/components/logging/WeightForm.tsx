"use client";
import { useState } from "react";
import { Check } from "lucide-react";

export function WeightForm({ onSubmit, isPending }: { onSubmit: (v: number) => Promise<any>; isPending: boolean }) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState("");

  const handle = async () => {
    if (!value) return;
    await onSubmit(Number(value));
    setFlash(value + " lbs");
    setValue("");
    setTimeout(() => setFlash(""), 2000);
  };

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 animate-fade-in">
      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#00E676]/10 border border-[#00E676]/20 rounded-xl mb-4 text-[#00E676] text-sm font-medium">
          <Check className="w-4 h-4" /> {flash} logged
        </div>
      )}
      <input value={value} onChange={e => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="Enter weight..." inputMode="decimal" autoFocus
        onKeyDown={e => e.key === "Enter" && value && handle()}
        className="w-full bg-[var(--secondary)] text-[var(--foreground)] text-lg px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none" />
      <button onClick={handle} disabled={!value || isPending}
        className="w-full mt-5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-4 rounded-xl text-sm tracking-wide font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-35 disabled:cursor-default">
        LOG WEIGHT
      </button>
    </div>
  );
}
