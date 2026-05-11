type Variant = "success" | "warning" | "error" | "info";

const colors: Record<Variant, string> = {
  success: "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20",
  warning: "bg-[#FFAB00]/10 text-[#FFAB00] border-[#FFAB00]/20",
  error: "bg-[#FF4455]/10 text-[#FF4455] border-[#FF4455]/20",
  info: "bg-[#3388FF]/10 text-[#3388FF] border-[#3388FF]/20",
};
const dots: Record<Variant, string> = {
  success: "bg-[#00E676]", warning: "bg-[#FFAB00]", error: "bg-[#FF4455]", info: "bg-[#3388FF]",
};

export function StatusBadge({ status, variant = "success" }: { status: string; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[1.2px] uppercase border ${colors[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />
      {status}
    </span>
  );
}

export function mapStatus(status: string): Variant {
  if (status === "on_track") return "success";
  if (status === "off_track") return "error";
  return "info";
}

export function mapConfidence(level: string): Variant {
  if (level === "high") return "success";
  if (level === "medium") return "warning";
  return "info";
}
