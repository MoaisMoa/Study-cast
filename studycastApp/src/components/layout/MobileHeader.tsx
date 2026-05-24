import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT, useThemeCtx } from "@/theme";
import { usePage } from "@/contexts/PageContext";
import { useSearch } from "@/contexts/SearchContext";
import { Icon } from "@/components/ui/Icon";
import { ProfileMenu } from "./ProfileMenu";

export function MobileHeader() {
  const T = useT();
  const { mode, toggle } = useThemeCtx();
  const { page, setPage } = usePage();
  const { setQuery } = useSearch();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const doSearch = () => {
    if (!searchVal.trim()) return;
    setQuery(searchVal.trim());
    setPage("search");
    setSearchOpen(false);
    navigate("/");
  };

  return (
    <header style={{
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      position: "sticky",
      top: 0,
      zIndex: 100,
      transition: "background 0.25s",
    }}>
      <div style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 28,
            height: 28,
            background: T.red,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 12,
            flexShrink: 0,
          }}>
            SC
          </div>
          {!searchOpen && (
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: T.text }}>
              스터디<span style={{ color: T.red }}>캐스트</span>
            </span>
          )}
          {searchOpen && (
            <input
              autoFocus
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") doSearch();
              }}
              placeholder="스터디 검색"
              style={{
                flex: 1,
                height: 32,
                paddingLeft: 10,
                paddingRight: 10,
                border: `1.5px solid ${T.red}`,
                borderRadius: 7,
                fontSize: 14,
                outline: "none",
                background: T.bg,
                color: T.text,
                fontFamily: "'Noto Sans KR',sans-serif",
              }}
            />
          )}
        </div>
        <button
          onClick={() => {
            if (searchOpen) doSearch();
            else {
              setSearchOpen(true);
              setSearchVal("");
            }
          }}
          aria-label="검색"
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Icon name="search" size={16} color={T.text2} />
        </button>
        {searchOpen && (
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchVal("");
            }}
            aria-label="검색 닫기"
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              border: `1px solid ${T.border}`,
              background: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={16} color={T.text2} />
          </button>
        )}
        <button
          onClick={toggle}
          aria-label="테마 전환"
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Icon name={mode === "dark" ? "sun" : "moon"} size={16} color={T.text2} />
        </button>
        <ProfileMenu avatarSize={32} caretSize={14} />
      </div>

      {/* 하단: 홈 / 방문한 방 탭 (데스크탑 헤더과 일치) */}
      <div style={{ display: "flex", padding: "0 16px", borderTop: `1px solid ${T.border}` }}>
        {([
          ["홈", "home"],
          ["방문한 방", "fav"],
        ] as const).map(([label, key]) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => {
                setPage(key);
                navigate("/");
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: active ? T.red : T.text2,
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? T.red : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
