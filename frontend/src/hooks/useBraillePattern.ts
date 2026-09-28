import { useMemo } from "react";
import { parseDots } from "../utils/brailleDots";

// 将点位串解析为可读的点阵状态，并提供按点位的查询
export function useBraillePattern(pattern: string) {
  const dots = useMemo(() => parseDots(pattern), [pattern]);
  return {
    dots,
    dotSet: useMemo(() => new Set(dots), [dots]),
    hasDot: (dot: number) => dots.includes(dot),
    pattern: dots.join(",")
  };
}
