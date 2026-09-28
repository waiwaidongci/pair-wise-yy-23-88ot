import { ERROR_CODES } from "./errorCodes";

/** 错误消息模板集中维护，service 与 store 包装异常时按 code 取用。 */
export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  STORAGE_UNAVAILABLE: "本机浏览器存储不可用，练习数据无法保存，请更换浏览器后重试",
  SEED_FAILED: "初始化课程与点字字符失败，请刷新页面重试",
  NOT_FOUND: "目标记录不存在或已被删除",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  SESSION_INVALID: "当前练习会话已失效，请重新选择课程开始练习",
  ANSWER_REJECTED: "作答提交被拒绝，请在一次进行中的练习里重新提交"
};
