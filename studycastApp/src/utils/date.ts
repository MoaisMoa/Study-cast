const KST_TZ = "Asia/Seoul";

/** 한국 전용 서비스 — 사용자 기기(브라우저) 시간대 설정과 무관하게 항상 한국(KST) 기준으로 "지금"을 계산 */
export function kstNow(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

const formatLocalDate = (date: Date): string => {
  const { year, month, day } = kstNow(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const todayStr = (): string => { return formatLocalDate(new Date()); };

export const offsetDate = (days: number): string => {
  const { year, month, day } = kstNow();
  // 브라우저 로컬 타임존(DST 등)에 영향받지 않도록 UTC 기준 순수 날짜 연산 후 재포맷
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

/** start~end 사이의 순수 날짜 차이(배제/exclusive) — "D-day 남은 일수" 등 카운트다운 용도 */
export const calcDays = (start: string, end: string): number | null => {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  const milliseconds = endDate.getTime() - startDate.getTime();

  return milliseconds >= 0
    ? Math.round(milliseconds / 86400000)
    : null;
};

/** start~end 양 끝 날짜를 모두 포함한 총 일수(포함/inclusive) — "총 기간 N일" 표시 용도 */
export const calcTotalDays = (start: string, end: string): number | null => {
  const days = calcDays(start, end);
  return days === null ? null : days + 1;
};
