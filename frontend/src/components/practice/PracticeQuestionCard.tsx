import { useEffect, useMemo, useState } from "react";
import type { PracticeQuestion } from "../../services/gradingService";
import type { Submission } from "../../stores/PracticeRunnerStore";
import { BrailleCell } from "../common/BrailleCell";
import { ResultBadge } from "../common/ResultBadge";
import { LessonProgress } from "../common/LessonProgress";
import { PracticePanel } from "../common/PracticePanel";
import { PracticeModeText } from "../../constants/PracticeMode";
import { MistakeReasonText } from "../../constants/MistakeReason";
import { formatLatency } from "../../utils/formatters";
import { parseDots, dotsToPattern } from "../../utils/brailleDots";
import { speak } from "../../utils/speech";

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  index: number;
  total: number;
  correctCount: number;
  elapsedMs: number;
  lastSubmission: Submission | null;
  onSubmit: (answer: string) => void;
  onNext: () => void;
}

export function PracticeQuestionCard({
  question,
  index,
  total,
  correctCount,
  elapsedMs,
  lastSubmission,
  onSubmit,
  onNext
}: PracticeQuestionCardProps) {
  const answered = Boolean(lastSubmission);
  const isLast = index + 1 === total;

  return (
    <PracticePanel
      title={`第 ${index + 1} / ${total} 题 · ${PracticeModeText[question.promptMode]}`}
      aside={
        <div className="practice-meta">
          <span>已答对 {correctCount}</span>
          <span>{formatLatency(elapsedMs)}</span>
        </div>
      }
    >
      <LessonProgress title="本组进度" current={index} total={total} compact />
      {question.promptMode === "CELL_TO_TEXT" && <CellToTextQuestion question={question} answered={answered} lastSubmission={lastSubmission} onSubmit={onSubmit} />}
      {question.promptMode === "LISTENING" && <ListeningQuestion question={question} answered={answered} lastSubmission={lastSubmission} onSubmit={onSubmit} />}
      {question.promptMode === "TEXT_TO_CELL" && <TextToCellQuestion question={question} answered={answered} lastSubmission={lastSubmission} onSubmit={onSubmit} />}

      {answered && (
        <div className="answer-feedback">
          <ResultBadge correct={lastSubmission!.correct} />
          <span>本题用时 {formatLatency(lastSubmission!.latencyMs)}</span>
          {!lastSubmission!.correct && (
            <span>
              错误原因：{MistakeReasonText[lastSubmission!.mistakeReason as keyof typeof MistakeReasonText] ?? "字符认错"}
            </span>
          )}
          <button type="button" className="btn primary" onClick={onNext}>
            {isLast ? "查看结果" : "下一题"}
          </button>
        </div>
      )}
    </PracticePanel>
  );
}

function FeedbackText({ question }: { question: PracticeQuestion }) {
  return (
    <p className="muted">
      正确答案：<strong>{question.symbol.letter}</strong>
      {question.promptMode === "TEXT_TO_CELL" ? `（点位 ${question.symbol.cell_pattern}）` : ` · ${question.symbol.pinyin}`}
    </p>
  );
}

function CellToTextQuestion({
  question,
  answered,
  lastSubmission,
  onSubmit
}: {
  question: PracticeQuestion;
  answered: boolean;
  lastSubmission: Submission | null;
  onSubmit: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");

  useEffect(() => setSelected(""), [question]);

  return (
    <div className="question-body">
      <p className="question-prompt">观察下方点阵，选择对应的文字：</p>
      <BrailleCell pattern={question.symbol.cell_pattern} label={question.symbol.letter} />
      <div className="option-grid">
        {question.options.map((option) => {
          const isAnswer = option.id === question.symbol.id;
          const isPicked = selected === option.letter || (answered && lastSubmission?.userAnswer === option.letter);
          const classes = ["option-btn"];
          if (answered && isAnswer) classes.push("correct");
          if (answered && isPicked && !isAnswer) classes.push("wrong");
          else if (!answered && isPicked) classes.push("selected");
          return (
            <button
              type="button"
              key={option.id}
              className={classes.join(" ")}
              disabled={answered}
              onClick={() => {
                setSelected(option.letter);
                onSubmit(option.letter);
              }}
            >
              {option.letter}
            </button>
          );
        })}
      </div>
      {answered && <FeedbackText question={question} />}
    </div>
  );
}

function ListeningQuestion({
  question,
  answered,
  lastSubmission,
  onSubmit
}: {
  question: PracticeQuestion;
  answered: boolean;
  lastSubmission: Submission | null;
  onSubmit: (answer: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    setSelected("");
    const timer = window.setTimeout(() => speak(question.symbol.pinyin), 300);
    return () => window.clearTimeout(timer);
  }, [question]);

  return (
    <div className="question-body">
      <p className="question-prompt">听读音，选择对应的文字：</p>
      <button type="button" className="btn listen-btn" onClick={() => speak(question.symbol.pinyin)}>
        🔊 再听一遍
      </button>
      <div className="option-grid">
        {question.options.map((option) => {
          const isAnswer = option.id === question.symbol.id;
          const isPicked = selected === option.letter || (answered && lastSubmission?.userAnswer === option.letter);
          const classes = ["option-btn"];
          if (answered && isAnswer) classes.push("correct");
          if (answered && isPicked && !isAnswer) classes.push("wrong");
          else if (!answered && isPicked) classes.push("selected");
          return (
            <button
              type="button"
              key={option.id}
              className={classes.join(" ")}
              disabled={answered}
              onClick={() => {
                setSelected(option.letter);
                onSubmit(option.letter);
              }}
            >
              {option.letter}
            </button>
          );
        })}
      </div>
      {answered && <FeedbackText question={question} />}
    </div>
  );
}

function TextToCellQuestion({
  question,
  answered,
  lastSubmission,
  onSubmit
}: {
  question: PracticeQuestion;
  answered: boolean;
  lastSubmission: Submission | null;
  onSubmit: (answer: string) => void;
}) {
  const [dots, setDots] = useState<number[]>([]);

  useEffect(() => setDots([]), [question]);

  const submittedDots = useMemo(
    () => (lastSubmission ? parseDots(lastSubmission.userAnswer) : []),
    [lastSubmission]
  );
  const shownDots = answered ? submittedDots : dots;

  const toggle = (dot: number) => {
    if (answered) return;
    setDots((prev) => (prev.includes(dot) ? prev.filter((value) => value !== dot) : [...prev, dot]));
  };

  return (
    <div className="question-body text-to-cell">
      <p className="question-prompt">
        为文字 <strong className="prompt-char">{question.symbol.letter}</strong> 选择正确点位：
      </p>
      <BrailleCell
        selected={shownDots}
        interactive={!answered}
        target={answered ? parseDots(question.symbol.cell_pattern) : []}
        onToggleDot={toggle}
        label={question.symbol.letter}
      />
      {!answered ? (
        <button type="button" className="btn primary" disabled={dots.length === 0} onClick={() => onSubmit(dotsToPattern(dots))}>
          提交点位
        </button>
      ) : (
        <FeedbackText question={question} />
      )}
    </div>
  );
}
