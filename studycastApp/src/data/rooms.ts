import type { Room, MyRoom } from "@/types";
import { IMGS } from "./images";

/** 라이브 + 신규 탭 전체 풀 */
export const ROOM_POOL: Room[] = [
  { id: 1,  title: "토익 900+ 목표반",          cat: "어학",     time: "2h 10m", members: 0, max: 4, img: IMGS[4], live: true,  type: "FREE",    recent: true,  createdDaysAgo: 30 },
  { id: 2,  title: "9급 행정학·헌법 집중반",    cat: "공무원",   time: "5h 10m", members: 3, max: 4, img: IMGS[5], live: true,  type: "FREE",    recent: false, createdDaysAgo: 25 },
  { id: 3,  title: "삼성·카카오 기술면접 준비", cat: "취업·면접", time: "2h 30m", members: 0, max: 4, img: IMGS[6], live: false, type: "PREMIUM", recent: true,  createdDaysAgo: 20 },
  { id: 4,  title: "리트코드 데일리 챌린지",    cat: "개발·IT",  time: "1h 20m", members: 1, max: 4, img: IMGS[7], live: false, type: "FREE",    recent: false, createdDaysAgo: 7 },
  { id: 5,  title: "수능 수학 킬러문항 정복반", cat: "대학생",   time: "3h 00m", members: 5, max: 4, img: IMGS[8], live: true,  type: "FREE",    recent: false, createdDaysAgo: 45, overCapacity: true },
  { id: 6,  title: "JLPT N2 일본어 집중반",     cat: "어학",     time: "2h 50m", members: 4, max: 4, img: IMGS[9], live: true,  type: "PREMIUM", recent: true,  createdDaysAgo: 15 },
  { id: 7,  title: "공인노무사 1차 기출 정복",  cat: "자격증",   time: "4h 20m", members: 0, max: 4, img: IMGS[0], live: false, type: "FREE",    recent: false, createdDaysAgo: 60 },
  { id: 8,  title: "AWS SAA 자격증 스터디",     cat: "개발·IT",  time: "2h 00m", members: 2, max: 4, img: IMGS[1], live: false, type: "FREE",    recent: true,  createdDaysAgo: 5 },
  { id: 9,  title: "OPIC IH 도전반",            cat: "어학",     time: "1h 45m", members: 0, max: 4, img: IMGS[2], live: true,  type: "FREE",    recent: false, createdDaysAgo: 22 },
  { id: 10, title: "코딩테스트 그리디·DP 집중", cat: "개발·IT",  time: "3h 10m", members: 3, max: 4, img: IMGS[3], live: true,  type: "FREE",    recent: false, createdDaysAgo: 18 },
  { id: 11, title: "경찰공무원 형사법 스터디",  cat: "공무원",   time: "4h 00m", members: 0, max: 4, img: IMGS[4], live: false, type: "FREE",    recent: false, createdDaysAgo: 50 },
  { id: 12, title: "정보보안기사 필기 준비반",  cat: "자격증",   time: "2h 30m", members: 1, max: 4, img: IMGS[5], live: false, type: "PREMIUM", recent: false, createdDaysAgo: 9 },
  { id: 13, title: "취업 자기소개서 스터디",    cat: "취업·면접", time: "1h 30m", members: 3, max: 4, img: IMGS[6], live: false, type: "FREE",    recent: true,  createdDaysAgo: 3 },
  { id: 14, title: "GRE 어휘 집중반",           cat: "어학",     time: "2h 10m", members: 0, max: 4, img: IMGS[7], live: true,  type: "FREE",    recent: false, createdDaysAgo: 12 },
  { id: 15, title: "프로그래머스 Level3 풀기",  cat: "개발·IT",  time: "2h 50m", members: 2, max: 4, img: IMGS[8], live: false, type: "FREE",    recent: false, createdDaysAgo: 35 },
  { id: 16, title: "세무사 1차 재무회계 집중",  cat: "자격증",   time: "5h 00m", members: 3, max: 4, img: IMGS[9], live: true,  type: "FREE",    recent: false, createdDaysAgo: 28 },
];

/** 추천 슬라이더용 (별도 풀, ROOM_POOL과 합쳐 사용) */
export const REC_ROOMS: Room[] = [
  { id: 1,  title: "정보처리기사 실기 D-5 집중반",   cat: "자격증",   time: "4h 50m", members: 4, max: 4, img: IMGS[1], live: true,  type: "FREE" },
  { id: 2,  title: "코딩테스트 완전정복 알고리즘반", cat: "개발·IT",  time: "3h 24m", members: 3, max: 4, img: IMGS[2], live: true,  type: "FREE" },
  { id: 3,  title: "정보처리기사 필기 기출 완전분석",cat: "자격증",   time: "2h 40m", members: 2, max: 4, img: IMGS[3], live: false, type: "FREE" },
  { id: 4,  title: "9급 행정직 국어 집중반",         cat: "공무원",   time: "3h 10m", members: 3, max: 4, img: IMGS[4], live: true,  type: "FREE" },
  { id: 5,  title: "토익 LC·RC 실전반",              cat: "어학",     time: "2h 00m", members: 2, max: 4, img: IMGS[5], live: false, type: "PREMIUM" },
  { id: 6,  title: "AWS Solutions Architect",        cat: "개발·IT",  time: "2h 20m", members: 1, max: 4, img: IMGS[6], live: false, type: "FREE" },
  { id: 7,  title: "공인중개사 1차 민법 정복",       cat: "자격증",   time: "4h 00m", members: 3, max: 4, img: IMGS[7], live: true,  type: "FREE" },
  { id: 8,  title: "수능 영어 1등급 목표반",         cat: "대학생",   time: "3h 30m", members: 2, max: 4, img: IMGS[8], live: false, type: "FREE" },
  { id: 9,  title: "카카오 코딩테스트 기출 풀기",    cat: "개발·IT",  time: "2h 50m", members: 4, max: 4, img: IMGS[9], live: true,  type: "PREMIUM" },
  { id: 10, title: "JLPT N1 독해 집중반",            cat: "어학",     time: "3h 10m", members: 2, max: 4, img: IMGS[0], live: false, type: "FREE" },
];

/** 내 스터디 슬롯 더미 */
export const MY_ROOMS_RAW: MyRoom[] = [
  { id: 1, title: "CS 코딩테스트 준비 2주차", members: 4, max: 4, img: IMGS[0], live: true,  createdAt: 1,    visitedAt: 1 },
  { id: 6, title: "JLPT N2 일본어 집중반",    members: 4, max: 4, img: IMGS[9], live: true,  createdAt: null, visitedAt: 2 },
  { id: 3, title: "삼성·카카오 기술면접 준비",members: 1, max: 4, img: IMGS[6], live: false, createdAt: null, visitedAt: 3 },
];
