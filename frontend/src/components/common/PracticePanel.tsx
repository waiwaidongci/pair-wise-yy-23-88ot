import type { ReactNode } from "react";

interface PracticePanelProps {
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function PracticePanel({ title, children, aside }: PracticePanelProps) {
  return (
    <section className="panel practice-panel">
      {(title || aside) && (
        <header className="practice-panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
