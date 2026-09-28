interface StatusBadgeProps {
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}

export function StatusBadge({ value, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`badge tone-${tone} ${String(value).toLowerCase().replace(/_/g, "-")}`}>{value}</span>
  );
}
