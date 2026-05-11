"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, setToken } from "@/lib/api";
import { GoogleButton } from "@/components/ui/GoogleButton";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handle = async () => {
    setError(""); setLoading(true);
    try { const { token } = await auth.signup(email, password); setToken(token); router.push("/onboarding"); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const handleGoogle = useCallback(async (idToken: string) => {
    setError(""); setLoading(true);
    try { const { token, isNewUser } = await auth.google(idToken); setToken(token); router.push(isNewUser ? "/onboarding" : "/dashboard"); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [router]);

  const inp = "w-full bg-[var(--secondary)] text-[var(--foreground)] text-base px-5 py-4 rounded-xl border border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--muted-foreground)] outline-none";

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-[var(--background)]">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center"><span className="text-[var(--primary-foreground)] font-extrabold text-sm font-[family-name:var(--font-anybody)]">F</span></div>
          <span className="font-extrabold text-xl text-[var(--foreground)] font-[family-name:var(--font-anybody)]">FORGE</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-1">Create account</h1>
        <p className="text-[var(--muted-foreground)] text-sm mb-8">Start building your physique with data.</p>
        {error && <p className="text-[var(--destructive)] text-sm mb-4 px-4 py-3 bg-[var(--destructive)]/10 rounded-xl border border-[var(--destructive)]/20">{error}</p>}
        <div className="flex flex-col gap-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className={inp} autoFocus />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (8+ chars)" type="password" className={inp} onKeyDown={e => e.key === "Enter" && email && password && handle()} />
        </div>
        <button onClick={handle} disabled={!email || !password || loading}
          className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold py-4 rounded-xl text-sm font-[family-name:var(--font-anybody)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-35">
          {loading ? "CREATING..." : "CREATE ACCOUNT"}
        </button>
        <GoogleButton onSuccess={handleGoogle} />
        <p className="text-center text-[var(--muted-foreground)] text-sm mt-6">Have an account? <Link href="/login" className="text-[var(--primary)] hover:underline">Log in</Link></p>
      </div>
    </div>
  );
}
