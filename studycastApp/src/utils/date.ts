const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const todayStr = (): string => { return formatLocalDate(new Date()); };

export const offsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

export const calcDays = (start: string, end: string): number | null => {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  const milliseconds = endDate.getTime() - startDate.getTime();

  return milliseconds >= 0
    ? Math.round(milliseconds / 86400000) + 1
    : null;
};
