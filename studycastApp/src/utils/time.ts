/** 초를 시·분으로 변환 */
export function fmtTimer(sec: number): { h: number; m: number } {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return { h, m };
}
