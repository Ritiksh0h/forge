"use client";
import { useState } from "react";
import { profile } from "@/lib/api";
import { ArrowRight } from "lucide-react";

interface Props { onComplete: () => void; }

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", goal: "", exp: "", gender: "", age: "", height: "", weight: "", activity: "" });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const N = 6;
  const can = [f.name.trim(), f.goal, f.exp, f.gender, f.age && f.height && f.weight, f.activity][step];

  const go = async () => {
    if (step < N - 1) { setStep(step + 1); return; }
    try {
      await profile.create({ name: f.name.trim(), goal: f.goal, experience: f.exp, gender: f.gender, age: Number(f.age), height: Number(f.height), weight: Number(f.weight), activity: f.activity });
      onComplete();
    } catch (e: any) { setError(e.message); }
  };

  const inp = "w-full bg-[var(--secondary)] text-[var(--foreground)] text-lg px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none";
  const sel = (on: boolean) => `w-full p-4 text-left rounded-xl border transition-all duration-200 cursor-pointer ${on ? "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]" : "bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border)]"}`;

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 bg-[var(--background)]">
      <div className="flex gap-1 mb-10">
        {Array.from({ length: N }).map((_, i) => (
          <div key={i} className="h-0.5 flex-1 rounded transition-colors" style={{ background: i <= step ? "var(--primary)" : "var(--border)" }} />
        ))}
      </div>

      <div className="animate-fade-in" key={step}>
        {step === 0 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Your name</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">This takes under a minute.</p>
          <input value={f.name} onChange={e => set("name", e.target.value)} placeholder="First name" className={inp} autoFocus onKeyDown={e => e.key === "Enter" && can && go()} />
        </div>)}
        {step === 1 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Goal</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Sets calorie surplus and gain thresholds.</p>
          <div className="flex flex-col gap-3">
            {[["Lean Bulk", "+250 cal · minimal fat"], ["Aggressive Bulk", "+450 cal · faster gains"], ["Recomp", "Maintenance · body recomp"]].map(([g, sub]) => (
              <button key={g} onClick={() => set("goal", g)} className={sel(f.goal === g)}>
                <span className="font-semibold text-sm block">{g}</span>
                <span className="text-[11px] opacity-60 block mt-0.5">{sub}</span>
              </button>
            ))}
          </div>
        </div>)}
        {step === 2 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Experience</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Affects recommendation sensitivity.</p>
          <div className="grid grid-cols-2 gap-3">
            {["6mo–1yr", "1–2yr", "2–3yr", "3yr+"].map(e => (
              <button key={e} onClick={() => set("exp", e)} className={`${sel(f.exp === e)} text-center`}>{e}</button>
            ))}
          </div>
        </div>)}
        {step === 3 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Gender</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">Used for calorie estimate only.</p>
          <div className="flex gap-3">
            {[["male", "Male"], ["female", "Female"]].map(([v, l]) => (
              <button key={v} onClick={() => set("gender", v)} className={`${sel(f.gender === v)} text-center flex-1`}>{l}</button>
            ))}
          </div>
        </div>)}
        {step === 4 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Your stats</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">For your starting calorie target.</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[var(--muted-foreground)] text-[10px] font-semibold tracking-[2px] mb-2 block uppercase">Age</label>
              <input value={f.age} onChange={e => set("age", e.target.value.replace(/[^0-9]/g, ""))} placeholder="25" className={inp} inputMode="numeric" />
            </div>
            <div>
              <label className="text-[var(--muted-foreground)] text-[10px] font-semibold tracking-[2px] mb-2 block uppercase">Height (inches)</label>
              <input value={f.height} onChange={e => set("height", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="70" className={inp} inputMode="decimal" />
            </div>
            <div>
              <label className="text-[var(--muted-foreground)] text-[10px] font-semibold tracking-[2px] mb-2 block uppercase">Weight (lbs)</label>
              <input value={f.weight} onChange={e => set("weight", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="175" className={inp} inputMode="decimal" />
            </div>
          </div>
        </div>)}
        {step === 5 && (<div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1.5">Training frequency</h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-6">How often do you train?</p>
          <div className="grid grid-cols-2 gap-3">
            {["3x/week", "4x/week", "5x/week", "6x/week"].map(a => (
              <button key={a} onClick={() => set("activity", a)} className={`${sel(f.activity === a)} text-center`}>{a}</button>
            ))}
          </div>
        </div>)}
      </div>

      {error && <p className="text-[var(--destructive)] text-sm mt-4">{error}</p>}

      <button onClick={go} disabled={!can}
        className="w-full mt-7 bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold py-4 rounded-xl text-base font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-35 disabled:cursor-default">
        {step < N - 1 ? <span className="flex items-center justify-center gap-2">NEXT <ArrowRight size={16} /></span> : "START FORGE"}
      </button>
    </div>
  );
}
