import { useAT } from "@/theme";

export function Divider({ label = "또는" }: { label?: string }) {
  const T = useAT();
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "20px 0",
      color: T.textM,
      fontSize: 12,
    }}>
      <div style={{ flex: 1, height: 1, background: T.borderM }} />
      {label}
      <div style={{ flex: 1, height: 1, background: T.borderM }} />
    </div>
  );
}
