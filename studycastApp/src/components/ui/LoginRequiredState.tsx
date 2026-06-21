import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Icon } from "@/components/ui/Icon";

export interface LoginRequiredStateProps {
  /** 안내 문구 1행 (예: "방문한 스터디 그룹을 보려면 로그인이 필요해요.") */
  message: string;
}

/** 비로그인 사용자에게 보여주는 공통 빈 상태 — 로그인하면 볼 수 있다는 안내 + 로그인 버튼 */
export function LoginRequiredState({ message }: LoginRequiredStateProps) {
  const T = useT();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // 헤더(데스크탑 64px / 모바일 52px) + 모바일 하단 탭바(60px)를 제외한 영역의 정중앙에 배치
  const offset = isMobile ? 52 + 60 : 64;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: `calc(100vh - ${offset}px)`, padding: "24px", gap: 14, textAlign: "center",
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: T.surface2, border: `1.5px dashed ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="lock" size={26} color={T.text3} strokeWidth={1.4} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text2, marginBottom: 5 }}>{message}</div>
        <div style={{ fontSize: 13, color: T.text3 }}>로그인하면 볼 수 있어요.</div>
      </div>
      <button
        onClick={() => navigate("/login")}
        style={{
          marginTop: 4, padding: "10px 26px", borderRadius: 8, border: "none",
          background: T.red, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        로그인하기
      </button>
    </div>
  );
}
