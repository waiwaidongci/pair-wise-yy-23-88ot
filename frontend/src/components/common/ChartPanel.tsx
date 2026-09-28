interface ChartPoint {
  label: string;
  value: number;
}

interface ChartPanelProps {
  title: string;
  points: ChartPoint[];
  /** 0-1 的值按百分比渲染，否则按数值 */
  percent?: boolean;
  emptyText?: string;
}

// 轻量内联 SVG 折线图，避免引入图表库的额外耦合
export function ChartPanel({ title, points, percent = true, emptyText = "暂无练习记录" }: ChartPanelProps) {
  const width = 560;
  const height = 200;
  const padding = { top: 18, right: 12, bottom: 28, left: 38 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const coordinates = points.map((point, index) => {
    const x = points.length <= 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth;
    const ratio = percent ? point.value : Math.max(point.value, 0) / Math.max(1, ...points.map((p) => p.value));
    const y = innerHeight - Math.min(1, Math.max(0, ratio)) * innerHeight;
    return { ...point, x, y };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      {points.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <g key={ratio}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid" />
                <text x={padding.left - 6} y={y + 4} textAnchor="end" className="chart-tick">
                  {Math.round(ratio * 100)}
                </text>
              </g>
            );
          })}
          <polyline
            points={polyline}
            fill="none"
            className="chart-line"
            transform={`translate(${padding.left},${padding.top})`}
          />
          {coordinates.map((point) => (
            <circle
              key={`${point.label}-${point.x}`}
              cx={point.x + padding.left}
              cy={point.y + padding.top}
              r={3.5}
              className="chart-dot"
            >
              <title>{`${point.label}：${Math.round(point.value * 100)}%`}</title>
            </circle>
          ))}
        </svg>
      )}
    </section>
  );
}
