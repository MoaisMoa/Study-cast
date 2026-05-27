import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { ModalProvider } from "@/contexts/ModalContext";
import { Dashboard } from "./sections/Dashboard";
import { Recommended } from "./sections/Recommended";
import { Browse } from "./sections/Browse";

/** 메인 페이지 (구 App 컴포넌트) — 라우터 `/` */
export default function MainPage() {
  const T = useT();
  const isMobile = useIsMobile();

  return (
    <ModalProvider>
      <div style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        transition: "background 0.25s",
      }}>
        {isMobile ? <MobileHeader /> : <Header />}
        <main style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "20px 16px 40px" : "28px 32px 60px",
        }}>
          <Dashboard />
          <Recommended />
          <Browse />
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
