import { parsePattern } from "../../utils/formatters";

interface BrailleCellProps {
  /** "1,2,4" 点位串；不传则使用 selectedDots。 */
  pattern?: string;
  selectedDots?: number[];
  /** 可点击的点（文字选点题型）；只读展示时保持 false。 */
  interactive?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  onToggleDot?: (dot: number) => void;
  /** 提交后高亮正确/错误点，参数为当前点是否属于正确点位。 */
  revealExpected?: string;
  label?: string;
}

/**
 * 盲文点阵共享组件：两列三行 6 个点。
 * 学习卡片只读展示；文字选点题型通过 interactive + onToggleDot 作答。
 */
export function BrailleCell({
  pattern,
  selectedDots,
  interactive = false,
  disabled = false,
  size = "md",
  onToggleDot,
  revealExpected,
  label
}: BrailleCellProps) {
  const active = new Set(pattern !== undefined ? parsePattern(pattern) : selectedDots ?? []);
  const expected = revealExpected !== undefined ? new Set(parsePattern(revealExpected)) : null;
  const dots = [1, 4, 2, 5, 3, 6];

  return (
    <div className={`braille-cell size-${size}`} aria-label={label ? `盲文点阵 ${label}` : "盲文点阵"}>
      {dots.map((dot) => {
        const isActive = active.has(dot);
        const isExpected = expected?.has(dot);
        const stateClass = expected
          ? isExpected
            ? " dot-correct"
            : isActive
              ? " dot-wrong"
              : ""
          : "";
        return (
          <button
            type="button"
            key={dot}
            disabled={!interactive || disabled}
            aria-pressed={isActive}
            aria-label={`${dot} 号点`}
            className={`dot${isActive ? " on" : ""}${stateClass}${interactive ? " clickable" : ""}`}
            onClick={() => onToggleDot?.(dot)}
          />
        );
      })}
    </div>
  );
}
