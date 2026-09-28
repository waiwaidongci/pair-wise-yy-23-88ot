import { formatPercent } from "../../utils/formatters";

export interface ChartPoint {
  label: string;
  /** 0-100。 */
  value: number;
}

interface ChartPanelProps {
  title: string;
  points: ChartPoint[];
  emptyHint?: string;
}

/**
 * 轻量正确率趋势图（纯 div 实现，不引第三方图表）。
 * 进度页展示最近若干次会话的得分变化。
 */
export function ChartPanel({ title, points, emptyHint = "完成练习后这里会出现趋势" }: ChartPanelProps) {
  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      {points.length === 0 ? (
        <p className="muted">{emptyHint}</p>
      ) : (
        <div className="chart">
          {points.map((point, index) => (
            <div className="chart-col" key={`${point.label}-${index}`} title={`${point.label}：${point.value} 分`}>
              <div className="chart-bar-track">
                <span className="chart-bar" style={{ height: `${Math.max(4, point.value)}%` }} />
              </div>
              <small>{formatPercent(point.value / 100)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
