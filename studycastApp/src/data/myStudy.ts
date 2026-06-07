import type {
  MyStudyRoom,
  SortValue,
  StatusFilter,
  VisibilityFilter,
} from "@/types/myStudy";
import { IMGS } from "./images";

/** mock 현재 로그인 유저 (로그인 더미 계정과 동일 기준) */
export const MOCK_MY_STUDY_USER = { id: "user_01", name: "test" };

/** 방장(user_01)이 생성한 스터디 mock 목록 */
export const MOCK_MY_STUDY_ROOMS: MyStudyRoom[] = [
  { id: "1", ownerId: "user_01", title: "리트코드 데일리 챌린지",   category: "개발·IT",  type: "FREE",    visibility: "public",  members: 5, maxMembers: 4, isLive: true,  createdAt: "2026-05-18", periodStart: "2026-04-10", periodEnd: "2026-07-10", img: IMGS[3], avgStudyTime: "1h 20m" },
  { id: "2", ownerId: "user_01", title: "AWS SAA 자격증 스터디",    category: "개발·IT",  type: "FREE",    visibility: "public",  members: 2, maxMembers: 4, isLive: false, createdAt: "2026-05-20", periodStart: "2026-05-01", periodEnd: "2026-07-31", img: IMGS[1], avgStudyTime: "2h 00m" },
  { id: "3", ownerId: "user_01", title: "JLPT N2 일본어 집중반",    category: "어학",     type: "PREMIUM", visibility: "private", members: 4, maxMembers: 4, isLive: true,  createdAt: "2026-05-10", periodStart: "2026-04-01", periodEnd: "2026-06-30", img: IMGS[5], avgStudyTime: "2h 50m" },
  { id: "4", ownerId: "user_01", title: "삼성·카카오 기술면접 준비", category: "취업·면접", type: "PREMIUM", visibility: "private", members: 0, maxMembers: 4, isLive: false, createdAt: "2026-05-05", periodStart: "2026-03-15", periodEnd: "2026-05-15", img: IMGS[6], avgStudyTime: "2h 30m" },
  { id: "5", ownerId: "user_01", title: "정보보안기사 필기 준비반",  category: "자격증",   type: "PREMIUM", visibility: "public",  members: 1, maxMembers: 4, isLive: false, createdAt: "2026-05-16", periodStart: "2026-05-05", periodEnd: "2026-08-05", img: IMGS[5], avgStudyTime: "2h 30m" },
  { id: "6", ownerId: "user_01", title: "취업 자기소개서 스터디",    category: "취업·면접", type: "FREE",    visibility: "public",  members: 3, maxMembers: 4, isLive: false, createdAt: "2026-05-22", periodStart: "2026-05-20", periodEnd: "2026-06-20", img: IMGS[6], avgStudyTime: "1h 30m" },
  { id: "7", ownerId: "user_01", title: "토익 900+ 비공개 스터디",  category: "어학",     type: "FREE",    visibility: "private", members: 2, maxMembers: 4, isLive: false, createdAt: "2026-05-21", periodStart: "2026-05-18", periodEnd: "2026-08-18", img: IMGS[2], avgStudyTime: "1h 45m" },
];

export const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "recent", label: "최근 생성순" },
  { value: "title", label: "제목순" },
  { value: "deadline", label: "종료 임박순" },
];

export const STATUS_FILTERS: StatusFilter[] = ["전체", "운영 중", "마감", "종료"];
export const VISIBILITY_FILTERS: VisibilityFilter[] = ["전체", "공개", "비공개"];

/** 비공개 방 입장용 mock 정답 코드 */
export const MOCK_JOIN_CODE = "1234";
