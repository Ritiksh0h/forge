"use client";
import { useState } from "react";
import { checkins } from "@/lib/api";
import { ClipboardCheck } from "lucide-react";

interface Props {
  checkIn: { type: string; question: string; options: { value: string; label: string }[] };
  onComplete: () => void;
}

export function CheckInCard({ checkIn, onComplete }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const handle = async (value: string) => {
    setSubmitting(true);
    try { await checkins.submit(checkIn.type, value); onComplete(); }
    catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[#3388FF]/20 animate-scale-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#3388FF]/10 flex items-center justify-center">
          <ClipboardCheck className="w-4 h-4 text-[#3388FF]" />
        </div>
        <span className="text-[9px] font-semibold text-[#3388FF] tracking-[2px]">DAILY CHECK-IN</span>
      </div>
      <p className="text-sm text-[var(--foreground)] mb-4 leading-relaxed">{checkIn.question}</p>
      <div className="flex gap-2 flex-wrap">
        {checkIn.options.map(opt => (
          <button key={opt.value} onClick={() => handle(opt.value)} disabled={submitting}
            className="flex-1 min-w-[60px] px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-xs font-medium text-center transition-all hover:border-[#3388FF]/40 active:scale-[0.97] disabled:opacity-50">
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
