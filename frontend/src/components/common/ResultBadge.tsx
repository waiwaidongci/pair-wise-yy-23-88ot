interface ResultBadgeProps {
  correct: boolean;
  label?: string;
}

export function ResultBadge({ correct, label }: ResultBadgeProps) {
  return (
    <span className={`result-badge ${correct ? "correct" : "wrong"}`}>
      {label ?? (correct ? "回答正确" : "回答错误")}
    </span>
  );
}
