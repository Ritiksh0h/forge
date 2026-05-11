export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 6e4) return "Now";
  if (diff < 36e5) return Math.floor(diff / 6e4) + "m";
  if (diff < 864e5) return Math.floor(diff / 36e5) + "h";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();
}
