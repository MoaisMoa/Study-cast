import { useT } from "@/theme";

export interface PwStrengthBarProps {
  pw: string;
  /** 트랙 배경색 (미지정 시 메인 테마 borderStrong 사용) */
  trackColor?: string;
}

/**
 * 메인 테마(useT) 기준 비밀번호 강도 표시 바.
 * (AuthPage에는 별도 `pages/AuthPage/components/PwStrengthBar`가 있다 — 그곳은 AuthTheme 사용)
 */
export function PwStrengthBar({ pw, trackColor }: PwStrengthBarProps) {
  const T = useT();
  if (!pw) return null;

  const fallback = trackColor ?? T.borderStrong;
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const validLen = pw.length >= 8 && pw.length <= 16;
  const met = [hasLetter, hasNumber, hasSpecial, validLen].filter(Boolean).length;

  let level: number;
  let color: string;
  let label: string;
  if (met <= 1) { level = 1; color = "#ef5350"; label = "보안 수준: 낮음"; }
  else if (met <= 3) { level = 2; color = "#ff9800"; label = "보안 수준: 보통"; }
  else { level = 3; color = "#4caf50"; label = "보안 수준: 강함 👍"; }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= level ? color : fallback,
              transition: "background .3s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color }}>{label}</div>
    </div>
  );
}
