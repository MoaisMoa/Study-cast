import { useEffect, useState } from "react";

function getNowDate(): string {
  const d = new Date();
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}년 ${mm}월 ${dd}일 ${days[d.getDay()]}`;
}

function getNowTime(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export function useClock() {
  const [dateStr, setDateStr] = useState(getNowDate);
  const [timeStr, setTimeStr] = useState(getNowTime);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDateStr(getNowDate());
      setTimeStr(getNowTime());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return { dateStr, timeStr };
}
