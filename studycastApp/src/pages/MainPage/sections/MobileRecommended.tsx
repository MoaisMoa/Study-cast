import { useEffect, useState } from "react";
import { useT } from "@/theme";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import { useAuth } from "@/contexts/AuthContext";
import type { Room } from "@/types";
import { listRecommended } from "@/services/roomService";
import { subscribeRoomJoined } from "@/utils/roomSession";
import { StudyCard } from "@/components/study/StudyCard";

export function MobileRecommended() {
  const T = useT();
  const ww = useWindowWidth();
  const { isLoggedIn } = useAuth();
  const is2col = ww >= 601 && ww <= 768;
  const VISIBLE = is2col ? 2 : 1;
  const [idx, setIdx] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    listRecommended({ guest: !isLoggedIn }).then(setRooms);
  }, [isLoggedIn]);

  // 다른 탭에서 방 입장이 완료되면 (참여 인원 변경) 다시 조회
  useEffect(() => {
    return subscribeRoomJoined(() => {
      listRecommended({ guest: !isLoggedIn }).then(setRooms);
    });
  }, [isLoggedIn]);

  const total = rooms.length;
  const maxIdx = Math.max(0, total - VISIBLE);

  useEffect(() => {
    if (total <= VISIBLE) return;

    const t = window.setInterval(
      () => setIdx((i) => (i >= maxIdx ? 0 : i + 1)),
      3000
    );

    return () => window.clearInterval(t);
  }, [total, VISIBLE, maxIdx]);

  useEffect(() => {
    setIdx(0);
  }, [total, VISIBLE]);

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
          {maxIdx + 1 > 0 ? `${idx + 1} / ${maxIdx + 1}` : ""}
        </span>
      </div>

      {total === 0 ? (
        <div style={{
          height: 150,
          borderRadius: T.radius,
          border: `1.5px dashed ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.surface2,
        }}>
          <span style={{ fontSize: 13, color: T.text3 }}>
            추천할 수 있는 스터디 그룹이 없습니다.
          </span>
        </div>
      ) : (
      <>
          <div style={{ overflow: "hidden", borderRadius: T.radius, paddingTop: 4, marginTop: -4 }}>
            <div style={{
              display: "flex",
              gap: 12,
              transition: "transform 0.45s cubic-bezier(.4,0,.2,1)",
              transform: `translateX(calc(-${idx} * (${cardW} + 12px)))`,
            }}>
              {rooms.map((r) => (
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
      </>
      )}
    </section>
  );
}
