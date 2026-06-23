import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { ModalProvider, useModal } from "@/contexts/ModalContext";
import { usePage } from "@/contexts/PageContext";
import { getRoomSummary } from "@/services/roomService";
import { Dashboard } from "./sections/Dashboard";
import { Recommended } from "./sections/Recommended";
import { Browse } from "./sections/Browse";
import { CardModal } from "./sections/CardModal";
import { SearchResultPage } from "./sections/SearchResultPage";
import { MobileDashboard } from "./sections/MobileDashboard";
import { MobileRecommended } from "./sections/MobileRecommended";
import { MobileBrowse } from "./sections/MobileBrowse";
import { MobileTabBar } from "./sections/MobileTabBar";

/** 메인 페이지 (구 App 컴포넌트) — 라우터 `/` */
export default function MainPage() {
  return (
    <ModalProvider>
      <MainPageInner />
    </ModalProvider>
  );
}

/** ModalProvider 안쪽 — usePage / CardModal 사용 가능한 위치 */
function MainPageInner() {
  const T = useT();
  const isMobile = useIsMobile();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { page } = usePage();
  const setModalRoom = useModal();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 이메일 초대 링크(`/?room=21`) 등으로 들어왔을 때 — 카드 클릭과 동일한 모달(코드 입력 포함)을 띄움
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (!roomParam || authLoading) return;

    // 비로그인이면 로그인 페이지로 이동, 로그인 후 같은 위치(?room=)로 복귀
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/?room=${roomParam}`)}`);
      return;
    }

    getRoomSummary(roomParam)
      .then(setModalRoom)
      .catch(() => { /* 존재하지 않거나 조회 실패 시 그냥 무시 */ })
      .finally(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("room");
        setSearchParams(next, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      display: "flex",
      flexDirection: "column",
      transition: "background 0.25s",
    }}>
      {/* 카드 클릭 모달 (전역 마운트) */}
      <CardModal />

      {isMobile ? (
        <>
          <MobileHeader />
          <main style={{ flex: 1 }}>
            {page === "search" ? (
              <div style={{ padding: "20px 16px 80px" }}>
                <SearchResultPage />
              </div>
            ) : (
              <>
                {isLoggedIn && <MobileDashboard />}
                <MobileRecommended />
                <MobileBrowse />
              </>
            )}
          </main>
          <MobileTabBar />
        </>
      ) : (
        <>
          <Header />
          <main style={{
            flex: 1,
            maxWidth: 1160,
            width: "100%",
            margin: "0 auto",
            padding: "28px 28px",
          }}>
            {page === "search" ? (
              <SearchResultPage />
            ) : (
              <>
                {isLoggedIn && <Dashboard />}
                <Recommended />
                <Browse />
              </>
            )}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
