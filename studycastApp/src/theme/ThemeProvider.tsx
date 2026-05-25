import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Theme, AuthTheme, RoomTheme, ThemeMode } from "@/types";
import { AUTH_DARK, AUTH_LIGHT, DARK, LIGHT, ROOM_DARK, ROOM_LIGHT } from "./tokens";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  /** 메인페이지용 풀 토큰 */
  T: Theme;
  /** AuthPage용 토큰 */
  AT: AuthTheme;
  /** RoomCreate용 토큰 */
  RT: RoomTheme;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "sc_theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setMode(mode === "light" ? "dark" : "light");

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.body.style.background = mode === "dark" ? DARK.bg : LIGHT.bg;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggle,
      T: mode === "dark" ? DARK : LIGHT,
      AT: mode === "dark" ? AUTH_DARK : AUTH_LIGHT,
      RT: mode === "dark" ? ROOM_DARK : ROOM_LIGHT,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemeCtx(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useThemeCtx must be used within ThemeProvider");
  return ctx;
}

/** 메인페이지 토큰 단축 */
export const useT = (): Theme => useThemeCtx().T;
/** Auth 토큰 단축 */
export const useAT = (): AuthTheme => useThemeCtx().AT;
/** RoomCreate 토큰 단축 */
export const useRT = (): RoomTheme => useThemeCtx().RT;
