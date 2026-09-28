interface StatCardProps {
  label: string;
  value: string | number;
}

/** 顶部指标卡：练习次数、正确率等页面共用。 */
export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
