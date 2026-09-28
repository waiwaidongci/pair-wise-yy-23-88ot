import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

/** 空状态：无错题、无练习记录时由错题本/进度页共用。 */
export function EmptyState({ title = "暂无数据", description, action }: EmptyStateProps) {
  return (
    <div className="empty" role="status">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
