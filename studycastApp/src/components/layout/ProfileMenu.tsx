import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { PROFILE_MENU } from "@/data/menus";
import { Icon } from "@/components/ui/Icon";

/** 헤더에서 사용하는 프로필 드롭다운 (데스크탑/모바일 사이즈는 prop으로) */
export interface ProfileMenuProps {
  avatarSize?: number;
  caretSize?: number;
}

export function ProfileMenu({ avatarSize = 36, caretSize = 16 }: ProfileMenuProps) {
  const T = useT();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  const handleClick = async (item: string) => {
    setOpen(false);
    if (item === "내 프로필") {
      navigate("/profile");
      return;
    }
    if (item === "내 스터디") {
      navigate("/my-study");
      return;
    }
    if (item === "방문한 방") {
      navigate("/visited-rooms");
      return;
    }
    // "내 스터디"는 화면 설계 코드가 아직 없으므로 라우트 미연결 (TODO)
    if (item === "로그아웃") {
      logout();
      navigate("/login");
    }
  };

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => navigate("/login")}
        style={{
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.text,
          borderRadius: 8,
          padding: "8px 14px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          flexShrink: 0
        }}
      >
        로그인
      </button>
    )
  }

  const avatarText = user?.name?.trim()?.charAt(0) || "나";

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          padding: "2px 4px",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <div style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          background: T.red,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: avatarSize >= 36 ? 15 : 13,
          flexShrink: 0,
        }}>
          {avatarText}
        </div>
        <Icon name="chevDown" size={caretSize} color={T.text3} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            boxShadow: T.shadowHover,
            minWidth: 150,
            overflow: "hidden",
            zIndex: 200,
          }}
        >
          {PROFILE_MENU.map((item, i) => {
            const isLast = i === PROFILE_MENU.length - 1;
            return (
              <button
                key={item}
                onClick={() => handleClick(item)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontSize: 14,
                  color: isLast ? T.red : T.text,
                  borderTop: isLast ? `1px solid ${T.border}` : "none",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
