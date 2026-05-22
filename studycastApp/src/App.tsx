import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageProvider } from "@/contexts/PageContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { GLOBAL_CSS } from "@/theme/globalStyles";
import { router } from "@/routes/router";

/**
 * 라우터 전용 루트 컴포넌트.
 * 전역 Provider만 감싸고, 화면 렌더링은 `router`에 위임한다.
 */
export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ThemeProvider>
        <AuthProvider>
          <PageProvider>
            <SearchProvider>
              <RouterProvider router={router} />
            </SearchProvider>
          </PageProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
