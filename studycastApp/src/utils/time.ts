/** 초를 시·분·초로 변환 */
export function fmtTimer(sec: number): { h: number; m: number; s: number } {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return { h, m, s };
}
