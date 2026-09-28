interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <em>{hint}</em>}
    </div>
  );
}
