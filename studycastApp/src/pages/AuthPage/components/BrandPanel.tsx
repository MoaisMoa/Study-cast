import { useAT, useThemeCtx } from "@/theme";

/** 좌측 브랜드/로고 패널 */
export function BrandPanel() {
  const T = useAT();
  const { mode } = useThemeCtx();
  const bg = mode === "dark" ? "#0a0a0a" : "#111";
  const gridColor = mode === "dark" ? "rgba(255,82,82,.1)" : "rgba(229,57,53,.07)";
  const scanColor = mode === "dark" ? "rgba(255,82,82,.22)" : "rgba(229,57,53,.18)";

  return (
    <div
      style={{
        background: bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="scanline"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(transparent,${scanColor},transparent)`,
          animation: "scanline 5s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* 로고 */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: T.red,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          SC
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-.3px" }}>
          스터디<span style={{ color: T.red }}>캐스트</span>
        </div>
      </div>

      {/* 중앙 텍스트 */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: T.red,
            borderRadius: 5,
            padding: "5px 12px",
            fontFamily: T.mono,
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 2,
            width: "fit-content",
            animation: "pulse 2s infinite",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#fff",
              animation: "blink 1s infinite",
              flexShrink: 0,
            }}
          />
          ON STUDY
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.25,
            letterSpacing: "-.5px",
          }}
        >
          지금 이 순간,<br />
          <span style={{ color: T.red }}>함께 공부하는</span><br />
          사람들이 있어요.
        </div>
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,.45)",
            lineHeight: 1.8,
            maxWidth: 340,
          }}
        >
          스터디캐스트는 카메라를 켜고 함께 공부하는<br />
          실시간 캠스터디 플랫폼입니다.<br />
          혼자보다 훨씬 더 집중되는 경험을 해보세요.
        </div>
      </div>

      <div />
    </div>
  );
}
