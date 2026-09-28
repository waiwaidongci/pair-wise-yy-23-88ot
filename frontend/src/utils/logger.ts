import { LOG_TEMPLATES, type LogTemplateGroup } from "../constants/logTemplates";

type Params = Record<string, string | number | boolean | undefined>;

function render(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? "" : String(params[key])
  );
}

// 所有写操作统一经此记录，保持“日志模板集中、调用处分散”的结构
export function logWrite(group: LogTemplateGroup, action: string, params: Params = {}): void {
  const groupTemplates = LOG_TEMPLATES[group] as Record<string, string>;
  const template = groupTemplates[action];
  if (!template) return;
  console.info(render(template, params));
}
