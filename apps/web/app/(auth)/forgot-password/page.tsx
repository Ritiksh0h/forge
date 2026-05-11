"use client";
import { useState } from "react";
import { auth } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handle = async () => {
    setError(""); setLoading(true);
    try { await auth.forgotPassword(email); setSent(true); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const inp = "w-full bg-[var(--secondary)] text-[var(--foreground)] text-base px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none";

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-[var(--background)]">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center"><span className="text-[var(--primary-foreground)] font-extrabold text-sm font-[family-name:var(--font-anybody)]">F</span></div>
          <span className="font-extrabold text-xl text-[var(--foreground)] font-[family-name:var(--font-anybody)]">FORGE</span>
        </div>
        {sent ? (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">Check your email</h1>
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-8">If an account exists for <span className="text-[var(--primary)]">{email}</span>, we sent a reset link.</p>
            <Link href="/login" className="text-[var(--primary)] text-sm hover:underline">← Back to login</Link>
          </div>
        ) : (<>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1">Forgot password</h1>
          <p className="text-[var(--muted-foreground)] text-sm mb-8">Enter your email and we'll send a reset link.</p>
          {error && <p className="text-[var(--destructive)] text-sm mb-4 px-4 py-3 bg-[var(--destructive)]/10 rounded-xl">{error}</p>}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className={inp} autoFocus onKeyDown={e => e.key === "Enter" && email && handle()} />
          <button onClick={handle} disabled={!email || loading} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold py-4 rounded-xl text-sm font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-35">
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>
          <p className="text-center text-[var(--muted-foreground)] text-sm mt-6"><Link href="/login" className="text-[var(--primary)] hover:underline">← Back to login</Link></p>
        </>)}
      </div>
    </div>
  );
}
