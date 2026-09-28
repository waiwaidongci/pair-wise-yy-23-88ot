import { LOG_TEMPLATES, type LogTemplateKey } from "../constants/logTemplates";

export type LogLevel = "info" | "warn" | "error";

/**
 * 集中日志器：所有写操作必须通过本模块记录，
 * 模板来自 constants/logTemplates，新增字段需同步模板与调用处。
 */
export function logEntity(
  entity: LogTemplateKey,
  action: string,
  params: Record<string, string | number> = {},
  level: LogLevel = "info"
) {
  const templates = LOG_TEMPLATES[entity] as Record<string, string>;
  const template = templates[action] ?? `${entity}.${action}`;
  const message = template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key])
  );
  const line = `[braille-trainer] ${entity}.${action} ${message}`;
  if (level === "error") console.error(line, params);
  else if (level === "warn") console.warn(line, params);
  else console.info(line, params);
}
