"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import Link from "next/link";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (password.length < 8) { setError("Password must be 8+ characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setError(""); setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inp = "w-full bg-[var(--secondary)] text-[var(--foreground)] text-base px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none";

  if (!token) return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">Invalid link</h1>
      <p className="text-[var(--muted-foreground)] text-sm mb-6">This reset link is missing or expired.</p>
      <Link href="/forgot-password" className="text-[var(--primary)] text-sm hover:underline">Request a new one →</Link>
    </div>
  );

  if (success) return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">Password reset</h1>
      <p className="text-[#00E676] text-sm mb-6">Your password has been updated. Redirecting to login...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1">New password</h1>
      <p className="text-[var(--muted-foreground)] text-sm mb-8">Choose a new password for your account.</p>
      {error && <p className="text-[var(--destructive)] text-sm mb-4 px-4 py-3 bg-[var(--destructive)]/10 rounded-xl border border-[var(--destructive)]/20">{error}</p>}
      <div className="flex flex-col gap-3">
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (8+ chars)" type="password" className={inp} autoFocus />
        <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" type="password" className={inp} onKeyDown={e => e.key === "Enter" && password && confirm && handle()} />
      </div>
      <button onClick={handle} disabled={!password || !confirm || loading}
        className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold py-4 rounded-xl text-sm font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-35">
        {loading ? "RESETTING..." : "RESET PASSWORD"}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-[var(--background)]">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--primary-foreground)] font-extrabold text-sm font-[family-name:var(--font-anybody)]">F</span>
          </div>
          <span className="font-extrabold text-xl text-[var(--foreground)] font-[family-name:var(--font-anybody)]">FORGE</span>
        </div>
        <Suspense fallback={<div className="h-40 bg-[var(--card)] rounded-2xl animate-pulse" />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
