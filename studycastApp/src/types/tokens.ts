import type { Theme, AuthTheme, RoomTheme } from "@/types";

/* ─── MainPage용 풀 토큰 (light/dark) ─── */
export const LIGHT: Theme = {
  red: "#E53935",
  redLight: "#FFEBEE",
  bg: "#f8f9fa",
  surface: "#ffffff",
  surface2: "#f1f3f5",
  border: "#e9ecef",
  borderStrong: "#dee2e6",
  text: "#212529",
  text2: "#495057",
  text3: "#868e96",
  shadow: "0 1px 4px rgba(0,0,0,.06)",
  shadowHover: "0 8px 24px rgba(0,0,0,.13)",
  shadowModal: "0 12px 40px rgba(0,0,0,.14)",
  radius: 8,
  dark: false,
};

export const DARK: Theme = {
  red: "#FF5252",
  redLight: "rgba(255,82,82,.2)",
  bg: "#1a1a1a",
  surface: "#242424",
  surface2: "#2e2e2e",
  border: "#3a3a3a",
  borderStrong: "#444444",
  text: "#f0f0f0",
  text2: "#b0b0b0",
  text3: "#7a7a7a",
  shadow: "0 1px 4px rgba(0,0,0,.4)",
  shadowHover: "0 8px 32px rgba(0,0,0,.6)",
  shadowModal: "0 12px 40px rgba(0,0,0,.7)",
  radius: 8,
  dark: true,
};

/* ─── AuthPage용 토큰 (light/dark) ─── */
export const AUTH_LIGHT: AuthTheme = {
  red: "#E53935",
  redH: "#C62828",
  redL: "#FFEBEE",
  redM: "rgba(229,57,53,.09)",
  bg: "#f8f9fa",
  surface: "#ffffff",
  border: "#e9ecef",
  borderM: "#dee2e6",
  text: "#212529",
  textS: "#495057",
  textM: "#868e96",
  mono: "'JetBrains Mono', monospace",
  sans: "'Noto Sans KR', sans-serif",
};

export const AUTH_DARK: AuthTheme = {
  red: "#FF5252",
  redH: "#E53935",
  redL: "rgba(255,82,82,.12)",
  redM: "rgba(255,82,82,.12)",
  bg: "#1a1a1a",
  surface: "#242424",
  border: "#2e2e2e",
  borderM: "#3a3a3a",
  text: "#f0f0f0",
  textS: "#b0b0b0",
  textM: "#666666",
  mono: "'JetBrains Mono', monospace",
  sans: "'Noto Sans KR', sans-serif",
};

/* ─── RoomCreatePage용 토큰 (light/dark) ─── */
export const ROOM_LIGHT: RoomTheme = {
  red: "#E53935",
  bg: "#f8f9fa",
  surface: "#ffffff",
  surface2: "#f1f3f5",
  surface3: "#e9ecef",
  border: "#e9ecef",
  text: "#212529",
  text2: "#495057",
  text3: "#868e96",
  muted: "#868e96",
  muted2: "#ced4da",
  shadow: "0 8px 24px rgba(0,0,0,0.12)",
  dateFilter: "none",
  placeholderColor: "#adb5bd",
};

export const ROOM_DARK: RoomTheme = {
  red: "#FF5252",
  bg: "#1a1a1a",
  surface: "#242424",
  surface2: "#2e2e2e",
  surface3: "#353535",
  border: "#3a3a3a",
  text: "#f0f0f0",
  text2: "#b0b0b0",
  text3: "#7a7a7a",
  muted: "#7a7a7a",
  muted2: "#555",
  shadow: "0 8px 24px rgba(0,0,0,0.5)",
  dateFilter: "invert(0.55)",
  placeholderColor: "#555",
};
