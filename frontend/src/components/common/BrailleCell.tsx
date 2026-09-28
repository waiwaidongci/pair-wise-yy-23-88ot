import { parseDots } from "../../utils/brailleDots";

interface BrailleCellProps {
  /** 展示模式的点位串，如 "1,3,4" */
  pattern?: string;
  /** 受控选中的点位（可交互模式优先于 pattern） */
  selected?: number[];
  size?: number;
  interactive?: boolean;
  /** 答题复盘时传入正确点位：多点标红、漏点描边 */
  target?: number[];
  onToggleDot?: (dot: number) => void;
  label?: string;
}

// 点位排布：1 4 / 2 5 / 3 6
const DOT_ORDER: number[] = [1, 4, 2, 5, 3, 6];

export function BrailleCell({
  pattern = "",
  selected,
  size = 132,
  interactive = false,
  target,
  onToggleDot,
  label
}: BrailleCellProps) {
  const raised = selected ?? parseDots(pattern);
  const raisedSet = new Set(raised);
  const targetSet = new Set(target ?? []);
  const review = targetSet.size > 0;
  const dotSize = Math.round(size * 0.2);
  const gap = Math.round(size * 0.09);

  return (
    <div className="braille-cell" role="img" aria-label={label ? `盲文点阵：${label}` : "盲文点阵"}>
      <div
        className="braille-cell-grid"
        style={{
          padding: gap,
          gap,
          gridTemplateRows: `repeat(3, ${dotSize}px)`,
          gridTemplateColumns: `repeat(2, ${dotSize}px)`
        }}
      >
        {DOT_ORDER.map((dot) => {
          const isRaised = raisedSet.has(dot);
          const isMissed = review && targetSet.has(dot) && !isRaised;
          const isExtra = review && isRaised && !targetSet.has(dot);
          return (
            <button
              type="button"
              key={dot}
              disabled={!interactive}
              aria-pressed={isRaised}
              aria-label={`第 ${dot} 点`}
              className={[
                "braille-dot",
                isRaised ? "raised" : "",
                interactive ? "interactive" : "",
                isMissed ? "missed" : "",
                isExtra ? "extra" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ width: dotSize, height: dotSize }}
              onClick={() => onToggleDot?.(dot)}
            />
          );
        })}
      </div>
    </div>
  );
}
