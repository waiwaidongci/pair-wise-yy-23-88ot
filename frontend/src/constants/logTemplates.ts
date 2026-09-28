// 每个实体至少 4 条日志模板，写操作均经 logger 输出
export const LOG_TEMPLATES = {
  BrailleSymbol: {
    CREATE: "[BrailleSymbol] 点字字符创建 id={id} letter={letter}",
    UPDATE: "[BrailleSymbol] 点字字符更新 id={id} fields={fields}",
    STATUS_CHANGE: "[BrailleSymbol] 点字字符状态变更 id={id} status={status}",
    EXPORT: "[BrailleSymbol] 点字字符导出 count={count}",
    SEED: "[BrailleSymbol] 点字字符种子写入 count={count}"
  },
  Lesson: {
    CREATE: "[Lesson] 课程创建 id={id} title={title}",
    UPDATE: "[Lesson] 课程更新 id={id} fields={fields}",
    STATUS_CHANGE: "[Lesson] 课程状态变更 id={id} status={status}",
    EXPORT: "[Lesson] 课程导出 count={count}",
    SEED: "[Lesson] 课程种子写入 count={count}"
  },
  PracticeSession: {
    CREATE: "[PracticeSession] 练习会话创建 id={id} lesson={lessonId} mode={mode}",
    UPDATE: "[PracticeSession] 练习会话更新 id={id} fields={fields}",
    STATUS_CHANGE: "[PracticeSession] 练习会话状态变更 id={id} status={status}",
    EXPORT: "[PracticeSession] 练习会话导出 count={count}",
    FINISH: "[PracticeSession] 练习会话结束 id={id} score={score} mistakes={mistakes}"
  },
  AnswerRecord: {
    CREATE: "[AnswerRecord] 答题记录创建 id={id} session={sessionId} correct={correct}",
    UPDATE: "[AnswerRecord] 答题记录更新 id={id} fields={fields}",
    STATUS_CHANGE: "[AnswerRecord] 错题状态变更 id={id} mastered={mastered}",
    EXPORT: "[AnswerRecord] 答题记录导出 count={count}",
    RESOLVE: "[AnswerRecord] 错题标记掌握 ids={ids}"
  },
  PracticeRunner: {
    START: "[Practice] 开始练习 lesson={lessonId} mode={mode} questions={questions}",
    SUBMIT: "[Practice] 提交答案 index={index} correct={correct} latency={latency}ms",
    COMPLETE: "[Practice] 练习完成 session={sessionId} 用时={duration}ms"
  }
} as const;

export type LogTemplateGroup = keyof typeof LOG_TEMPLATES;
