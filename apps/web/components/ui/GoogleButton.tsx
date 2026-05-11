"use client";
import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleButton({ onSuccess }: { onSuccess: (idToken: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onSuccess);
  cbRef.current = onSuccess;

  useEffect(() => {
    if (!CLIENT_ID) return;
    const id = "google-gsi";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.src = "https://accounts.google.com/gsi/client"; s.async = true;
      document.head.appendChild(s);
    }
    const init = () => {
      (window as any).google?.accounts?.id?.initialize({
        client_id: CLIENT_ID,
        callback: (r: any) => cbRef.current(r.credential),
      });
      if (ref.current) {
        (window as any).google?.accounts?.id?.renderButton(ref.current, {
          type: "standard", theme: "filled_black", size: "large", text: "continue_with", width: ref.current.offsetWidth,
        });
      }
    };
    if ((window as any).google?.accounts) init();
    else { const s = document.getElementById(id); s?.addEventListener("load", init); }
  }, []);

  if (!CLIENT_ID) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[var(--muted-foreground)] text-[10px] tracking-[2px]">OR</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}
