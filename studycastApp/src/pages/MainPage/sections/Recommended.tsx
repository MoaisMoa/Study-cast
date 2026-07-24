import { useEffect, useState } from "react";
import type { Room } from "@/types";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { StudyCard } from "@/components/study/StudyCard";
import { listRecommended } from "@/services/roomService";
import { subscribeRoomJoined } from "@/utils/roomSession";
import { subscribeMainRoomUpdates } from "@/services/studyRoomService";

const VISIBLE = 3;

export function Recommended() {
  const T = useT();
  const { isLoggedIn } = useAuth();
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    listRecommended({ guest: !isLoggedIn }).then(setFiltered);
  }, [isLoggedIn]);

  // 다른 탭에서 방 입장이 완료되면 (참여 인원 변경) 다시 조회
  useEffect(() => {
    return subscribeRoomJoined(() => {
      listRecommended({ guest: !isLoggedIn }).then(setFiltered);
    });
  }, [isLoggedIn]);

  // 다른 사용자의 입장/퇴장으로 인한 인원수·LIVE 상태를 실시간 반영 (전체 재조회 없이 해당 방만 patch)
  useEffect(() => {
    return subscribeMainRoomUpdates(({ roomNo, currentUsers, live }) => {
      setFiltered((prev) => prev.map((r) => (r.id === roomNo ? { ...r, members: currentUsers, live, overCapacity: currentUsers > r.max } : r)));
    });
  }, []);

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
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginRight: 8 }}>추천 스터디</h2>
        <span style={{ fontSize: 12, color: T.text3 }}>{isLoggedIn ? "목표 시험·자격증에 맞는 방" : "지금 활발한 스터디"}</span>
      </div>

      {total === 0 ? (
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
          <div style={{ overflow: "hidden", borderRadius: T.radius, paddingTop: 4, marginTop: -4 }}>
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
            <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 8 }}>
              {Array.from({ length: maxIdx + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1}\ubc88\uc9f8 \ud398\uc774\uc9c0`}
                  onClick={() => setIdx(i)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: "6px 3px",
                    margin: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: i === idx ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === idx ? T.red : T.borderStrong,
                      transition: "all 0.25s",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
