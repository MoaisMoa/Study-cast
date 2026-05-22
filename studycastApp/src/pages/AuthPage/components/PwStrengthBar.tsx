import { useAT } from "@/theme";

export function PwStrengthBar({ pw }: { pw: string }) {
  const T = useAT();
  if (!pw) return null;

  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const validLen = pw.length >= 8 && pw.length <= 16;

  const metCount = [hasLetter, hasNumber, hasSpecial, validLen].filter(Boolean).length;

  let level: number;
  let color: string;
  let label: string;
  if (metCount <= 1) {
    level = 1; color = "#ef5350"; label = "보안 수준: 낮음";
  } else if (metCount <= 3) {
    level = 2; color = "#ff9800"; label = "보안 수준: 보통";
  } else {
    level = 3; color = "#4caf50"; label = "보안 수준: 강함 👍";
  }

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
              background: i <= level ? color : T.borderM,
              transition: "background .3s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color }}>{label}</div>
    </div>
  );
}
