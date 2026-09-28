// 盲文点位工具：cell_pattern 形如 "1,3,4"
export function parseDots(pattern: string): number[] {
  return pattern
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => value >= 1 && value <= 6)
    .sort((a, b) => a - b);
}

export function dotsToPattern(dots: number[]): string {
  return [...new Set(dots)].sort((a, b) => a - b).join(",");
}

export function sameDots(a: string, b: string): boolean {
  return dotsToPattern(parseDots(a)) === dotsToPattern(parseDots(b));
}
