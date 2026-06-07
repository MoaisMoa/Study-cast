import { useEffect, useState } from "react";
import type { Room } from "@/types";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { StudyCard } from "@/components/study/StudyCard";
import { listRecommended } from "@/services/roomService";

const VISIBLE = 3;

export function Recommended() {
  const T = useT();
  const { isLoggedIn } = useAuth();
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    listRecommended().then(setFiltered);
  }, [isLoggedIn]);

  const total = filtered.length;
  const maxIdx = Math.max(0, total - VISIBLE);

  useEffect(() => {
    if (total <= VISIBLE) return;
    const t = window.setInterval(() => setIdx((i) => (i >= maxIdx ? 0 : i + 1)), 3000);
    return () => window.clearInterval(t);
  }, [total, maxIdx]);

  useEffect(() => {
    setIdx(0);
  }, [total]);

  const cardW = `calc((100% - ${(VISIBLE - 1) * 16}px) / ${VISIBLE})`;

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginRight: 8 }}>추천 스터디</h2>
        <span style={{ fontSize: 12, color: T.text3 }}>목표 시험·자격증에 맞는 방</span>
      </div>

      {!isLoggedIn ? (
        <div style={{
          height: 180,
          borderRadius: T.radius,
          border: `1.5px dashed ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.surface2,
        }}>
          <span style={{ fontSize: 14, color: T.text3 }}>로그인 후 이용해주세요.</span>
        </div>
      ) : total === 0 ? (
        <div style={{
          height: 180,
          borderRadius: T.radius,
          border: `1.5px dashed ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.surface2,
        }}>
          <span style={{ fontSize: 14, color: T.text3 }}>추천할 수 있는 스터디 그룹이 없습니다.</span>
        </div>
      ) : (
        <>
          <div style={{ overflow: "hidden", borderRadius: T.radius, padding: "4px 0 0 0" }}>
            <div style={{
              display: "flex",
              gap: 16,
              transform: `translateX(calc(-${idx} * (${cardW} + 16px)))`,
              transition: "transform 0.5s cubic-bezier(.4,0,.2,1)",
            }}>
              {filtered.map((r) => (
                <div key={r.id} style={{ flexShrink: 0, width: cardW }}>
                  <StudyCard room={r} />
                </div>
              ))}
            </div>
          </div>
          {total > VISIBLE && (
            <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
              {Array.from({ length: maxIdx + 1 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setIdx(i)}
                  style={{
                    width: i === idx ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === idx ? T.red : T.borderStrong,
                    transition: "all 0.25s",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
