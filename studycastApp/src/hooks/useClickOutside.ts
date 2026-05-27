import { useEffect } from "react";
import type { RefObject } from "react";

/** ref 바깥 영역 클릭 시 `handler` 호출 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  active: boolean = true
): void {
  useEffect(() => {
    if (!active) return;
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler, active]);
}
