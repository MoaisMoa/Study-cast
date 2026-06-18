export interface AuthUser {
  email: string;
  name: string;
  profileImage?: string;
}

export type ProfileMenuItem = "내 프로필" | "내 스터디" | "방문한 방" | "로그아웃";
