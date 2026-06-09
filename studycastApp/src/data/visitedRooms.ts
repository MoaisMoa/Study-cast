import type { VisitedRoom } from "@/types/visitedRoom";
import { IMGS } from "./images";

/**
 * 방문한 방 mock 원본.
 * - 최근 방문: visitedAtOrder 오름차순(작을수록 최신)
 * - 자주 방문: visitCount 내림차순 (5회 이상)
 * - 동일 방이 양쪽에 모두 표시될 수 있음
 */
export const VISITED_ROOMS_RAW: VisitedRoom[] = [
  {
    id: 1, title: "정보처리기사 실기 D-30 집중반", cat: "자격증", time: "4h 12m", img: IMGS[0],
    members: 3, max: 4, visibility: "public", type: "FREE", status: "open",
    isLive: true, isNew: false, visitedAt: "방금 전", visitedAtOrder: 1, visitCount: 12, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 2, title: "토익 LC·RC 900점 목표 스터디", cat: "어학", time: "3h 40m", img: IMGS[1],
    members: 4, max: 4, visibility: "public", type: "FREE", status: "full",
    isLive: true, isNew: false, visitedAt: "1시간 전", visitedAtOrder: 2, visitCount: 8, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 3, title: "JLPT N2 독해·청해 집중 스터디", cat: "어학", time: "3h 20m", img: IMGS[2],
    members: 4, max: 4, visibility: "private", type: "FREE", status: "full",
    isLive: false, isNew: false, visitedAt: "3일 전", visitedAtOrder: 4, visitCount: 18, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 4, title: "삼성·카카오 기술면접 완전정복", cat: "취업·면접", time: "5h 00m", img: IMGS[3],
    members: 2, max: 4, visibility: "private", type: "PREMIUM", status: "ended",
    isLive: false, isNew: false, visitedAt: "1주 전", visitedAtOrder: 5, visitCount: 14, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 7, title: "토익 900+ 비공개 스터디", cat: "어학", time: "2h 50m", img: IMGS[4],
    members: 2, max: 4, visibility: "private", type: "FREE", status: "open",
    isLive: false, isNew: true, visitedAt: "3시간 전", visitedAtOrder: 3, visitCount: 9, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 5, title: "9급 공무원 행정학·헌법 집중반", cat: "공무원", time: "6h 05m", img: IMGS[0],
    members: 4, max: 4, visibility: "public", type: "FREE", status: "open",
    isLive: true, isNew: false, visitedAt: "2주 전", visitedAtOrder: 7, visitCount: 47, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
  {
    id: 6, title: "AWS SAA 자격증 주 4회 스터디", cat: "개발·IT", time: "2h 30m", img: IMGS[1],
    members: 1, max: 4, visibility: "public", type: "FREE", status: "open",
    isLive: false, isNew: false, visitedAt: "1주 전", visitedAtOrder: 6, visitCount: 38, hasEntered: true,
    period: { total: 90, start: "2026.05.23", end: "2026.08.21" },
  },
];

const dedupe = (list: VisitedRoom[]): VisitedRoom[] =>
  list.filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i);

/** 최근 방문: 입장 이력 + 미삭제/미제한 + visitCount>=1, visitedAtOrder 오름차순 */
export const buildRecentRooms = (raw: VisitedRoom[]): VisitedRoom[] =>
  dedupe(
    [...raw]
      .filter((r) => r.hasEntered && r.status !== "deleted" && r.status !== "restricted" && r.visitCount >= 1)
      .sort((a, b) => a.visitedAtOrder - b.visitedAtOrder)
  );

/** 자주 방문: visitCount>=5, 내림차순(동률은 최근 방문 우선) */
export const buildFrequentRooms = (raw: VisitedRoom[]): VisitedRoom[] =>
  dedupe(
    [...raw]
      .filter((r) => r.hasEntered && r.status !== "deleted" && r.status !== "restricted" && r.visitCount >= 5)
      .sort((a, b) => {
        if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount;
        return a.visitedAtOrder - b.visitedAtOrder;
      })
  );
