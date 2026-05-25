export type ThemeMode = "light" | "dark";

/** 메인 페이지에서 사용하는 풀 토큰 (Header/Browse/Card 공용) */
export interface Theme {
  red: string;
  redLight: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  shadow: string;
  shadowHover: string;
  shadowModal: string;
  radius: number;
  dark: boolean;
}

/** Auth 페이지에서 사용하는 좁은 토큰 (기존 AuthPage T 구조 유지) */
export interface AuthTheme {
  red: string;
  redH: string;
  redL: string;
  redM: string;
  bg: string;
  surface: string;
  border: string;
  borderM: string;
  text: string;
  textS: string;
  textM: string;
  mono: string;
  sans: string;
}

/** RoomCreate 페이지에서 사용하는 토큰 (기존 RoomCreate T 구조 유지) */
export interface RoomTheme {
  red: string;
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  text: string;
  text2: string;
  text3: string;
  muted: string;
  muted2: string;
  shadow: string;
  dateFilter: string;
  placeholderColor: string;
}
