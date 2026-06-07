import { useLocation, useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { usePage } from "@/contexts/PageContext";
import type { PageKey } from "@/contexts/PageContext";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface TabItem {
  label: string;
  icon: IconName;
  /** 메인 페이지 내부에서 전환하는 키 (null 이면 라우트/외부 동작) */
  key: PageKey | null;
  /** key 가 null 일 때 사용할 라우트 (없으면 클릭 무시) */
  route?: string;
}

const TABS: TabItem[] = [
  { label: "홈",       icon: "home",   key: "home" },
  { label: "방문한 방", icon: "heart",  key: null, route: "/visited-rooms" },
  { label: "내 프로필", icon: "person", key: null, route: "/profile" },
];

/**
 * 모바일 하단 고정 탭바 (V3 메인 디자인 기준).
 * - 홈 / 방문한 방 → MainPage 내부 page state 전환 (PageContext)
 * - 내 프로필 → /profile 라우트 이동
 */
export function MobileTabBar() {
  const T = useT();
  const { page, setPage } = usePage();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: 60,
      background: T.surface,
      borderTop: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      zIndex: 200,
      transition: "background 0.25s",
    }}>
      {TABS.map((t) => {
        const active = t.route ? pathname === t.route : (t.key ? page === t.key && pathname === "/" : false);
        return (
          <button
            key={t.label}
            onClick={() => {
              if (t.key) {
                setPage(t.key);
                navigate("/");
              } else if (t.route) {
                navigate(t.route);
              }
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: t.key || t.route ? "pointer" : "default",
              padding: 0,
            }}
          >
            <Icon
              name={t.icon}
              size={20}
              color={active ? T.red : T.text3}
              strokeWidth={active ? 2 : 1.5}
            />
            <span style={{
              fontSize: 10,
              color: active ? T.red : T.text3,
              fontWeight: active ? 600 : 400,
            }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
