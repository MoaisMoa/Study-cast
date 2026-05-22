import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainPage } from "@/pages/MainPage";
import { LoginPage, SignupPage } from "@/pages/AuthPage";
import { RoomCreatePage } from "@/pages/RoomCreatePage";
import { ProfilePage } from "@/pages/ProfilePage";

/**
 * 전역 라우트 정의.
 *
 * - /                → MainPage
 * - /login           → AuthPage (mode="login")
 * - /signup          → AuthPage (mode="signup")
 * - /rooms/new       → RoomCreatePage
 * - /profile         → ProfilePage
 *
 * 비밀번호 찾기(find-pw) / 인증번호 확인(verify) / 비밀번호 재설정(reset)
 * 3단계는 별도 라우트가 아니라 AuthPage 내부 state로 관리한다.
 */
export const router = createBrowserRouter([
  { path: "/",          element: <MainPage /> },
  { path: "/login",     element: <LoginPage /> },
  { path: "/signup",    element: <SignupPage /> },
  { path: "/rooms/new", element: <RoomCreatePage /> },
  { path: "/profile",   element: <ProfilePage /> },
  { path: "*",          element: <Navigate to="/" replace /> },
]);
