import { useT } from "@/theme";

const COLUMNS: Array<[string, string[]]> = [
  ["서비스", ["스터디 둘러보기", "스터디 개설", "내 스터디", "랭킹"]],
  ["지원", ["공지사항", "FAQ", "문의하기", "버그 제보"]],
  ["회사", ["회사 소개", "채용", "블로그", "파트너십"]],
];

const FOOTER_LINKS = ["이용약관", "개인정보처리방침", "운영정책"];

export function Footer() {
  const T = useT();
  return (
    <footer style={{
      background: T.surface,
      borderTop: `1px solid ${T.border}`,
      padding: "32px 0 20px",
      transition: "background 0.25s,border-color 0.25s",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 28px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 24,
          marginBottom: 28,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, background: T.red, borderRadius: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 12,
              }}>
                SC
              </div>
              <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>
                스터디<span style={{ color: T.red }}>캐스트</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.7 }}>
              함께 공부하고,<br />함께 성장하는<br />캠 스터디 플랫폼
            </p>
          </div>
          {COLUMNS.map(([title, links]) => (
            <div key={title}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.text,
                marginBottom: 10,
                letterSpacing: "0.03em",
              }}>
                {title}
              </div>
              {links.map((l) => (
                <div key={l} style={{ marginBottom: 7 }}>
                  <a
                    href="#"
                    style={{ fontSize: 12, color: T.text3, transition: "color 0.12s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.red)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}
                  >
                    {l}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: `1px solid ${T.border}`,
          paddingTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: T.text3 }}>© 2025 스터디캐스트. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16 }}>
            {FOOTER_LINKS.map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: 11, color: T.text3 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
