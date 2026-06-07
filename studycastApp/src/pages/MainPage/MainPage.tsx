import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { ModalProvider } from "@/contexts/ModalContext";
import { usePage } from "@/contexts/PageContext";
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
  const { page } = usePage();

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
                <MobileDashboard />
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
                <Dashboard />
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
