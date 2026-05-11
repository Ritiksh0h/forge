"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { history, logs } from "@/lib/api";
import { EntryList } from "@/components/history/EntryList";

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["history", filter], queryFn: () => history.get(filter, 60) });

  const handleDelete = async (type: string, id: string) => {
    await logs.delete(type, id);
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-[family-name:var(--font-anybody)] mb-2">History</h1>
      <div className="flex gap-2">
        {[["all", "All"], ["weight", "Weight"], ["calories", "Cals"], ["workout", "Lifts"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all ${filter === id
              ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
              : "text-[var(--muted-foreground)] border border-transparent hover:border-[var(--border)]"}`}>
            {label}
          </button>
        ))}
      </div>
      {isLoading
        ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[var(--card)] rounded-2xl animate-pulse" />)}</div>
        : <EntryList entries={data?.entries || []} onDelete={handleDelete} />}
    </div>
  );
}
