import { useRT } from "@/theme";

/** 인원 도트 표시 (RoomCreate 인원 입력 미리보기) */
export function MemberDots({ count, max = 4, stretch = false }: { count: number; max?: number; stretch?: boolean }) {
  const T = useRT();
  return (
    <div style={{ display: "flex", gap: 5, marginTop: stretch ? 0 : 8, width: stretch ? "100%" : undefined }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: stretch ? undefined : 28,
            flex: stretch ? 1 : undefined,
            height: 5,
            borderRadius: 99,
            background: i < count ? T.red : T.muted2,
            transition: "background 0.18s",
          }}
        />
      ))}
    </div>
  );
}
