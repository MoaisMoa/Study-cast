import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT, useThemeCtx } from "@/theme";
import { usePage } from "@/contexts/PageContext";
import { useSearch } from "@/contexts/SearchContext";
import { Icon } from "@/components/ui/Icon";
import { ProfileMenu } from "./ProfileMenu";

/** 데스크탑 헤더 (모든 페이지 공용) */
export function Header() {
  const T = useT();
  const { mode, toggle } = useThemeCtx();
  const { page, setPage } = usePage();
  const { setQuery } = useSearch();
  const navigate = useNavigate();
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const doSearch = () => {
    if (!searchVal.trim()) return;
    setQuery(searchVal.trim());
    setPage("search");
    navigate("/");
  };

  return (
    <header
      style={{
        height: 64,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 16,
        transition: "background 0.25s,border-color 0.25s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexShrink: 0,
          marginRight: 28,
          cursor: "pointer",
        }}
        onClick={() => {
          setPage("home");
          navigate("/");
        }}
      >
        <div
          style={{
            width: 36, height: 36,
            background: T.red,
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 16,
          }}
        >
          SC
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: T.text }}>
          스터디<span style={{ color: T.red }}>캐스트</span>
        </span>
      </div>

      <nav style={{ display: "flex", gap: 2, marginRight: "auto", alignItems: "center" }}>
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
                padding: "7px 14px",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? T.text : T.text2,
                background: active ? T.bg : "none",
                border: "none",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <div style={{
        position: "relative",
        width: searchFocus ? 300 : 220,
        transition: "width 0.2s ease",
        flexShrink: 0,
      }}>
        <button
          onClick={doSearch}
          aria-label="검색"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <Icon name="search" size={16} color={searchFocus ? T.red : T.text3} />
        </button>
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doSearch();
          }}
          placeholder="스터디 검색"
          style={{
            width: "100%",
            height: 38,
            paddingLeft: 34,
            paddingRight: 12,
            border: `1.5px solid ${searchFocus ? T.red : T.border}`,
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            background: T.bg,
            color: T.text,
            fontFamily: "'Noto Sans KR',sans-serif",
            transition: "border-color 0.15s",
          }}
        />
      </div>

      <button
        onClick={toggle}
        aria-label="테마 전환"
        title={mode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.text2,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={mode === "dark" ? "sun" : "moon"} size={16} color={T.text2} />
      </button>

      <ProfileMenu />
    </header>
  );
}
