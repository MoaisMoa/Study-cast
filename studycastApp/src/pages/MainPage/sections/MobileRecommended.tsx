import { useEffect, useState } from "react";
import { useT } from "@/theme";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { REC_ROOMS } from "@/data/rooms";
import { StudyCard } from "@/components/study/StudyCard";

export function MobileRecommended() {
  const T = useT();
  const ww = useWindowWidth();
  const is2col = ww >= 601 && ww <= 768;
  const VISIBLE = is2col ? 2 : 1;
  const [idx, setIdx] = useState(0);
  const total = REC_ROOMS.length;
  const maxIdx = Math.max(0, total - VISIBLE);

  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i >= maxIdx ? 0 : i + 1)), 3000);
    return () => window.clearInterval(t);
  }, [maxIdx]);

  const cardW = `calc((100% - ${(VISIBLE - 1) * 12}px) / ${VISIBLE})`;

  return (
    <section style={{ padding: "16px 16px 0" }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>추천 스터디</h2>
          <span style={{ fontSize: 11, color: T.text3 }}>목표에 맞는 방</span>
        </div>
        <span style={{ fontSize: 11, color: T.text3 }}>
          {idx + 1} / {maxIdx + 1}
        </span>
      </div>

      <div style={{ overflow: "hidden", borderRadius: T.radius }}>
        <div style={{
          display: "flex",
          gap: 12,
          transition: "transform 0.45s cubic-bezier(.4,0,.2,1)",
          transform: `translateX(calc(-${idx} * (${cardW} + 12px)))`,
        }}>
          {REC_ROOMS.map((r) => (
            <div key={r.id} style={{ flexShrink: 0, width: cardW }}>
              <StudyCard room={r} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10 }}>
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <div
            key={i}
            onClick={() => setIdx(i)}
            style={{
              width: i === idx ? 16 : 5,
              height: 5,
              borderRadius: 3,
              background: i === idx ? T.red : T.borderStrong,
              transition: "all 0.25s",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </section>
  );
}
