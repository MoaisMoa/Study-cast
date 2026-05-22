import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type PageKey = "home" | "fav" | "search";

interface PageContextValue {
  page: PageKey;
  setPage: (p: PageKey) => void;
}

const PageCtx = createContext<PageContextValue | null>(null);

export function PageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageKey>("home");
  const value = useMemo<PageContextValue>(() => ({ page, setPage }), [page]);
  return <PageCtx.Provider value={value}>{children}</PageCtx.Provider>;
}

export function usePage(): PageContextValue {
  const ctx = useContext(PageCtx);
  if (!ctx) throw new Error("usePage must be used within PageProvider");
  return ctx;
}
