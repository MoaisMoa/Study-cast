import { useEffect, useState } from "react";

/** 화면 너비가 `breakpoint`(px) 미만이면 true */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [m, setM] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const fn = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [breakpoint]);
  return m;
}
