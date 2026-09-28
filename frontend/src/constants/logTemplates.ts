/**
 * 日志模板集中存放，每个实体至少 4 条，所有写操作都必须记录日志。
 * 字段变更时需要同步修改这里与调用处（utils/logger）。
 */
export const LOG_TEMPLATES = {
  BrailleSymbol: {
    create: "点字字符创建 #{id}：{letter}（{category}，点位 {cell_pattern}）",
    update: "点字字符更新 #{id}：字段 {fields} 已变更",
    seed: "点字字符状态变更：已从种子数据写入 {count} 条字符",
    export: "点字字符导出：共 {count} 条"
  },
  Lesson: {
    create: "课程创建 #{id}：{title}（阶段 {stage}，{symbolCount} 个字符）",
    update: "课程更新 #{id}：字段 {fields} 已变更",
    seed: "课程状态变更：已从种子数据写入 {count} 门课程",
    export: "课程导出：共 {count} 门"
  },
  PracticeSession: {
    create: "练习会话创建 #{id}：课程 {lessonId}，模式 {mode}",
    finish: "练习会话更新 #{id}：得分 {score}，错题 {mistakeCount}/{totalCount}",
    seed: "练习会话状态变更：本地存储已重置",
    export: "练习会话导出：共 {count} 次"
  },
  AnswerRecord: {
    create: "答题记录创建 #{id}：字符 {symbolId}，{result}，用时 {latencyMs}ms",
    resolve: "答题记录更新 #{id}：错题已被重新答对并消化",
    seed: "答题记录状态变更：本地存储已重置",
    export: "答题记录导出：共 {count} 条"
  }
} as const;

export type LogTemplateKey = keyof typeof LOG_TEMPLATES;
