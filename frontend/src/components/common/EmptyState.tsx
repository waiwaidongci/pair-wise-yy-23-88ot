import type { EmptyStateProps } from "./EmptyState.types";

export function EmptyState({ title = "暂无数据", description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-glyph" aria-hidden>
        ⠿
      </div>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
