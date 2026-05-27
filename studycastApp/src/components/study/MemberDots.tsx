import { useRT } from "@/theme";

/** 인원 도트 표시 (RoomCreate 인원 입력 미리보기) */
export function MemberDots({ count, max = 4 }: { count: number; max?: number }) {
  const T = useRT();
  return (
    <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 28,
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
