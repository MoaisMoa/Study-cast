export const todayStr = (): string => new Date().toISOString().split("T")[0];

export const offsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const calcDays = (start: string, end: string): number | null => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms >= 0 ? Math.round(ms / 86400000) + 1 : null;
};
