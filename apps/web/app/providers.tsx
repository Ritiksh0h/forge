"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Component, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">Something broke</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-3 px-8 rounded-xl">RELOAD</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 10000, retry: 1 }, mutations: { retry: 0 } },
  }));
  return <ErrorBoundary><QueryClientProvider client={qc}>{children}</QueryClientProvider></ErrorBoundary>;
}
