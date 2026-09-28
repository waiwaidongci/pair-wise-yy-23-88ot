import { useMemo, useState } from "react";
import { parsePattern } from "../utils/formatters";

/**
 * 盲文点阵交互 hook：管理 1-6 号点的选中状态。
 * - 初始值来自字符 cell_pattern（学习卡片只读展示时使用）
 * - toggle 供"文字选点"题型点击点位作答
 * - dots 为按点位编号升序的数组，grid 供 BrailleCell 渲染两列方阵
 */
export function useBraillePattern(initialPattern = "") {
  const [dots, setDots] = useState<number[]>(() => parsePattern(initialPattern));

  const toggle = (dot: number) => {
    setDots((current) =>
      current.includes(dot) ? current.filter((item) => item !== dot) : [...current, dot].sort((a, b) => a - b)
    );
  };

  const reset = (pattern = "") => setDots(parsePattern(pattern));
  const clear = () => setDots([]);

  /** 两列三行：左列 1,2,3；右列 4,5,6。 */
  const grid = useMemo(
    () =>
      [1, 4, 2, 5, 3, 6].map((dot) => ({
        dot,
        active: dots.includes(dot)
      })),
    [dots]
  );

  return { dots, toggle, reset, clear, grid };
}
