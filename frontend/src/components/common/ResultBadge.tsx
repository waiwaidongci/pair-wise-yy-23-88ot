import { MistakeReasonText } from "../../constants/MistakeReason";

interface ResultBadgeProps {
  correct: boolean;
  /** 答错时展示错误原因；答对可不传。 */
  reason?: keyof typeof MistakeReasonText | "";
}

/** 单题判题结果徽标：练习页即时反馈与错题本共用。 */
export function ResultBadge({ correct, reason = "" }: ResultBadgeProps) {
  if (correct) {
    return <span className="badge result-correct">回答正确</span>;
  }
  return (
    <span className="badge result-wrong">
      回答错误{reason ? ` · ${MistakeReasonText[reason]}` : ""}
    </span>
  );
}
