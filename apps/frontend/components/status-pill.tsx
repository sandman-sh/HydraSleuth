type StatusPillProps = {
  label: string;
  tone?: "neutral" | "good" | "warn" | "critical";
};

const toneMap: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  neutral: "badge-outline border-white/12 bg-base-300/55 text-base-content/78",
  good: "badge-outline border-neon/30 bg-neon/10 text-neon",
  warn: "badge-outline border-sand/30 bg-sand/10 text-sand",
  critical: "badge-outline border-ember/30 bg-ember/10 text-ember",
};

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <span className={`badge h-auto px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
