import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router-dom";
import { MainPage } from "@/pages/MainPage";
import { LoginPage, SignupPage } from "@/pages/AuthPage";
import { RoomCreatePage } from "@/pages/RoomCreatePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { MyStudyPage } from "@/pages/MyStudyPage";
import { VisitedRoomsPage } from "@/pages/VisitedRoomsPage";
import { StudyRoomPage } from "@/pages/StudyRoomPage";
import { SubscriptionPage } from "@/pages/PaymentPage/SubscriptionPage";
import { PaymentSuccess } from "@/pages/PaymentPage/PaymentSuccess";
import { PaymentFail } from "@/pages/PaymentPage/PaymentFail";

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/",             element: <MainPage /> },
      { path: "/login",        element: <LoginPage /> },
      { path: "/signup",       element: <SignupPage /> },
      { path: "/rooms/new",    element: <RoomCreatePage /> },
      { path: "/rooms/:roomId", element: <StudyRoomPage /> },
      { path: "/profile",      element: <ProfilePage /> },
      { path: "/my-study",     element: <MyStudyPage /> },
      { path: "/visited-rooms",    element: <VisitedRoomsPage /> },
      { path: "/payments/success", element: <PaymentSuccess /> },
      { path: "/payments/fail",    element: <PaymentFail /> },
      { path: "*",                 element: <Navigate to="/" replace /> },
    ],
  },
]);
