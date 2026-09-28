import { STATUS_TEXT } from "../../constants/statusText";

type BadgeKind = keyof typeof STATUS_TEXT;

interface StatusBadgeProps {
  value: string;
  kind?: BadgeKind;
}

/** 枚举状态徽标：文案统一从 constants/statusText 读取。 */
export function StatusBadge({ value, kind }: StatusBadgeProps) {
  const table = kind ? (STATUS_TEXT[kind] as Record<string, string>) : null;
  const text = table ? table[value] ?? value : String(value).replace(/_/g, " ");
  return <span className={"badge " + String(value).toLowerCase().replace(/_/g, "-")}>{text}</span>;
}
