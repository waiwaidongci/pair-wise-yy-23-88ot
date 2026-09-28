import type { ReactNode } from "react";

interface PracticePanelProps {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** 练习面板：统一练习区标题、提示与操作区布局。 */
export function PracticePanel({ title, hint, children, footer }: PracticePanelProps) {
  return (
    <section className="panel practice-panel">
      <header className="practice-panel-head">
        <h2>{title}</h2>
        {hint ? <p className="panel-hint">{hint}</p> : null}
      </header>
      <div className="practice-panel-body">{children}</div>
      {footer ? <footer className="practice-panel-foot">{footer}</footer> : null}
    </section>
  );
}
