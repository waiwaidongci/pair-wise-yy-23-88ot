import { useEffect } from "react";
import { BrailleCell } from "../common/BrailleCell";
import { PracticePanel } from "../common/PracticePanel";
import { ResultBadge } from "../common/ResultBadge";
import { StatusBadge } from "../common/StatusBadge";
import { useBraillePattern } from "../../hooks/useBraillePattern";
import { usePracticeSession } from "../../hooks/usePracticeSession";
import type { BrailleSymbol } from "../../types/BrailleSymbol";
import type { PracticeMode } from "../../constants/PracticeMode";
import { PracticeModeText } from "../../constants/PracticeMode";
import { MistakeReasonText } from "../../constants/MistakeReason";
import type { PracticeQuestion } from "../../utils/practice";
import { formatLatency, formatDots } from "../../utils/formatters";
import type { QuestionFeedback } from "../../hooks/usePracticeSession";

interface PracticeRunnerProps {
  sessionKey: number;
  pool: BrailleSymbol[];
  mode: PracticeMode;
  lessonId: number;
  title: string;
  onRetry: () => void;
  onExit: () => void;
}

/** 听写提示：优先调用浏览器语音合成，不可用时退化为字符提示文案。 */
function speak(symbol: BrailleSymbol | null) {
  if (!symbol) return;
  if (typeof speechSynthesis === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(symbol.letter);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function PracticeRunner(props: PracticeRunnerProps) {
  const { sessionKey, pool, mode, lessonId, title, onRetry, onExit } = props;
  const runner = usePracticeSession({ sessionKey, pool, mode, lessonId });

  if (runner.phase === "loading") {
    return (
      <PracticePanel title={title} hint="正在准备题组…">
        <p className="muted">从本机课程数据中抽取字符并创建练习会话。</p>
      </PracticePanel>
    );
  }

  if (runner.phase === "finished" && runner.error) {
    return (
      <PracticePanel title={title}>
        <p className="error-text">{runner.error}</p>
        <div className="inline-actions">
          <button type="button" className="btn primary" onClick={onExit}>返回</button>
        </div>
      </PracticePanel>
    );
  }

  if (runner.phase === "finished") {
    const total = runner.answers.length;
    const latencySum = runner.answers.reduce((sum, item) => sum + item.latencyMs, 0);
    const accuracy = total === 0 ? 0 : runner.correctCount / total;
    return (
      <PracticePanel
        title={`${title} · 结果`}
        hint="会话与逐题记录已保存到本机，刷新或离开后仍可在错题本和进度页查看。"
        footer={
          <div className="inline-actions">
            <button type="button" className="btn primary" onClick={onRetry}>再练一组</button>
            <button type="button" className="btn" onClick={onExit}>返回</button>
          </div>
        }
      >
        <div className="metrics result-metrics">
          <div className="stat"><span>得分</span><strong>{Math.round(accuracy * 100)}</strong></div>
          <div className="stat"><span>正确 / 总数</span><strong>{runner.correctCount}/{total}</strong></div>
          <div className="stat"><span>平均用时</span><strong>{formatLatency(total ? latencySum / total : 0)}</strong></div>
        </div>
        <ul className="review-list">
          {runner.answers.map((item, answerIndex) => (
            <li key={answerIndex} className="review-row">
              <BrailleCell pattern={item.question.symbol.cell_pattern} size="sm" />
              <span className="review-letter">{item.question.symbol.letter}</span>
              <ResultBadge correct={item.grade.correct} reason={item.grade.mistake_reason} />
              <span className="muted">{formatLatency(item.latencyMs)}</span>
            </li>
          ))}
        </ul>
      </PracticePanel>
    );
  }

  const question = runner.currentQuestion;
  if (!question) return null;

  return (
    <PracticePanel
      title={title}
      hint={`${PracticeModeText[mode]} · 第 ${runner.index + 1}/${runner.questions.length} 题`}
      footer={
        runner.feedback ? (
          <div className="inline-actions">
            <button type="button" className="btn primary" onClick={() => void runner.next()}>
              {runner.index + 1 >= runner.questions.length ? "提交并查看结果" : "下一题"}
            </button>
          </div>
        ) : (
          <p className="panel-hint">提交后立即显示对错和本题用时。</p>
        )
      }
    >
      <QuestionCard
        key={`${sessionKey}-${runner.index}`}
        question={question}
        feedback={runner.feedback}
        onSubmit={(picked, dots) => runner.submit(picked, dots)}
      />
    </PracticePanel>
  );
}

interface QuestionCardProps {
  question: PracticeQuestion;
  feedback: QuestionFeedback | null;
  onSubmit: (picked: BrailleSymbol | undefined, dots: number[]) => void;
}

function QuestionCard({ question, feedback, onSubmit }: QuestionCardProps) {
  const { kind, symbol, options } = question;
  const pattern = useBraillePattern("");

  // 听写题进入时自动朗读一次。
  useEffect(() => {
    if (kind === "LISTENING") speak(symbol);
  }, [kind, symbol]);

  const locked = feedback !== null;

  const submitChoice = (option: BrailleSymbol) => {
    if (locked) return;
    onSubmit(option, []);
  };
  const submitDots = () => {
    if (locked) return;
    onSubmit(undefined, pattern.dots);
  };

  return (
    <div className="question-card">
      <div className="question-prompt">
        {kind === "CELL_TO_TEXT" && (
          <>
            <p className="panel-hint">识别下面的点阵，选出对应字符</p>
            <BrailleCell
              pattern={symbol.cell_pattern}
              size="lg"
              label={symbol.letter}
            />
          </>
        )}
        {kind === "LISTENING" && (
          <>
            <p className="panel-hint">听发音，选出对应字符（可重复播放）</p>
            <button type="button" className="btn speaker" onClick={() => speak(symbol)}>🔊 播放发音</button>
          </>
        )}
        {kind === "TEXT_TO_CELL" && (
          <>
            <p className="panel-hint">
              请在点阵上选出字符 <strong className="big-letter">{symbol.letter}</strong>（{symbol.pinyin}）的全部点位
            </p>
            <BrailleCell
              selectedDots={pattern.dots}
              interactive
              disabled={locked}
              size="lg"
              onToggleDot={pattern.toggle}
              revealExpected={locked ? symbol.cell_pattern : undefined}
              label={symbol.letter}
            />
          </>
        )}
      </div>

      {kind !== "TEXT_TO_CELL" && (
        <div className="option-grid">
          {options.map((option) => {
            const isPicked = feedback && option.letter === feedback.grade.normalized;
            const isAnswer = feedback && option.id === symbol.id;
            return (
              <button
                type="button"
                key={option.id}
                disabled={locked}
                className={`option-btn${isPicked ? (feedback?.grade.correct ? " picked-correct" : " picked-wrong") : ""}${isAnswer && !feedback?.grade.correct ? " reveal-answer" : ""}`}
                onClick={() => submitChoice(option)}
              >
                <span className="option-letter">{option.letter}</span>
                <small className="muted">{option.pinyin}</small>
              </button>
            );
          })}
        </div>
      )}

      {kind === "TEXT_TO_CELL" && !locked && (
        <div className="inline-actions">
          <button type="button" className="btn" onClick={pattern.clear}>清空点位</button>
          <button type="button" className="btn primary" onClick={submitDots}>提交作答</button>
        </div>
      )}

      {feedback && (
        <div className="feedback">
          <ResultBadge correct={feedback.grade.correct} reason={feedback.grade.mistake_reason} />
          <span className="muted">本题用时 {formatLatency(feedback.latencyMs)}</span>
          {!feedback.grade.correct && (
            <span className="feedback-detail">
              正确答案：<strong>{symbol.letter}</strong>
              <BrailleCell pattern={symbol.cell_pattern} size="sm" />
              点位 {formatDots(symbol.cell_pattern)}
              {feedback.grade.mistake_reason ? (
                <StatusBadge value={feedback.grade.mistake_reason} kind="MistakeReason" />
              ) : null}
              <span className="muted">
                （{MistakeReasonText[feedback.grade.mistake_reason as keyof typeof MistakeReasonText] ?? ""}已记入错题本）
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
