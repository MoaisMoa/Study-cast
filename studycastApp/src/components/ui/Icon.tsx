import type { CSSProperties } from "react";

/** SVG path 정의 — 메인페이지 + RoomCreate에서 사용하는 아이콘 통합 */
const PATHS_24: Record<string, string> = {
  search:    `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`,
  chevDown:  `<polyline points="6 9 12 15 18 9"/>`,
  chevLeft:  `<polyline points="15 18 9 12 15 6"/>`,
  chevRight: `<polyline points="9 18 15 12 9 6"/>`,
  edit:      `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  check:     `<polyline points="20 6 9 17 4 12"/>`,
  plus:      `<path d="M12 5v14m-7-7h14"/>`,
  users:     `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  x:         `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
  home:      `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  heart:     `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`,
  person:    `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  sun:       `<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41"/>`,
  moon:      `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
  sortAsc:   `<path d="M11 11h4"/><path d="M11 15h7"/><path d="M11 19h10"/><path d="M9 7 6 4 3 7"/><path d="M6 4v16"/>`,
  filter:    `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
  history:   `<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>`,
  alertCircle:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  bookOpen:  `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  alertTri:  `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  trash:     `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`,
  tag:       `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>`,
};

/** RoomCreate 전용 16-viewBox 아이콘들 */
const PATHS_16: Record<string, string> = {
  camera:   `<rect x="1" y="4" width="10" height="8" rx="1.5"/><path d="M11 6.5l4-2v7l-4-2"/>`,
  mic:      `<rect x="5" y="1" width="6" height="9" rx="3"/><path d="M2 8a6 6 0 0 0 12 0M8 14v-2"/>`,
  lock:     `<rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>`,
  globe:    `<circle cx="8" cy="8" r="6.5"/><path d="M8 1.5C6 4 5 6 5 8s1 4 3 6.5M8 1.5C10 4 11 6 11 8s-1 4-3 6.5M1.5 8h13"/>`,
  image:    `<rect x="1" y="2" width="14" height="12" rx="2"/><circle cx="5.5" cy="6" r="1.5"/><path d="M1 10l4-4 3 3 2-2 5 5"/>`,
  calendar: `<rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1.5" x2="5" y2="4.5"/><line x1="11" y1="1.5" x2="11" y2="4.5"/>`,
  bell:     `<path d="M8 1a5 5 0 0 1 5 5v3l1.5 2H1.5L3 9V6a5 5 0 0 1 5-5z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>`,
};

export type IconName =
  | "search" | "chevDown" | "chevLeft" | "chevRight" | "edit" | "check" | "plus"
  | "users" | "x" | "home" | "heart" | "person" | "sun" | "moon"
  | "sortAsc" | "filter" | "bookOpen" | "alertTri" | "trash" | "tag" | "history" | "alertCircle"
  | "camera" | "mic" | "lock" | "globe" | "image" | "calendar" | "bell";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 1.5, style }: IconProps) {
  const is16 = name in PATHS_16;
  const inner = is16 ? PATHS_16[name] : PATHS_24[name] ?? "";
  return (
    <svg
      width={size}
      height={size}
      viewBox={is16 ? "0 0 16 16" : "0 0 24 24"}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
