import { useEffect, useState } from "react";
import type { MyRoom } from "@/types";
import { useT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";
import { fmtTimer } from "@/utils/time";
import { listMyRooms } from "@/services/roomService";

/** 내 스터디 + 스탯 (각오 / 디데이 / 타이머) */
export function Dashboard() {
  const T = useT();
  const { isLoggedIn } = useAuth();
  const setModalRoom = useModal();

  const [rooms, setRooms] = useState<MyRoom[]>([]);
  useEffect(() => {
    if (!isLoggedIn) return;
    listMyRooms().then(setRooms);
  }, [isLoggedIn]);

  const [elapsed, setElapsed] = useState(0);
  const [editRes, setEditRes] = useState(false);
  const [res, setRes] = useState("오늘도 집중해서 목표 달성!");
  const [resDraft, setResDraft] = useState(res);
  const [editDday, setEditDday] = useState(false);
  const [ddayNum, setDdayNum] = useState(12);
  const [ddayName, setDdayName] = useState("정보처리기사 실기");
  const [ddayNumD, setDdayNumD] = useState(12);
  const [ddayNameD, setDdayNameD] = useState("정보처리기사 실기");
  const [myIdx, setMyIdx] = useState(0);

  const hasRooms = rooms.length > 0;
  const curRoom = hasRooms ? rooms[Math.min(myIdx, rooms.length - 1)] : null;

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { h, m } = fmtTimer(elapsed);
  const pct = Math.min((elapsed / (8 * 3600)) * 100, 100);

  const scrollToStudy = () =>
    document.getElementById("my-study-section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section
      id="my-study-section"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.7fr",
        gap: 20,
        marginBottom: 32,
      }}
    >
      {/* 왼쪽: 내 스터디 */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>내 스터디</h2>
          {isLoggedIn && hasRooms && (
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setMyIdx((i) => Math.max(0, i - 1))}
                style={{
                  width: 26, height: 26, borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", opacity: myIdx === 0 ? 0.35 : 1,
                }}
              >
                <Icon name="chevLeft" size={14} color={T.text3} />
              </button>
              <button
                onClick={() => setMyIdx((i) => Math.min(rooms.length - 1, i + 1))}
                style={{
                  width: 26, height: 26, borderRadius: 4,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", opacity: myIdx === rooms.length - 1 ? 0.35 : 1,
                }}
              >
                <Icon name="chevRight" size={14} color={T.text3} />
              </button>
            </div>
          )}
        </div>
        <div style={{
          aspectRatio: "4/3",
          borderRadius: T.radius,
          overflow: "hidden",
          position: "relative",
          cursor: isLoggedIn && hasRooms ? "pointer" : "default",
        }}>
          {!isLoggedIn ? (
            <div style={{
              width: "100%",
              height: "100%",
              background: T.surface2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: `1.5px dashed ${T.border}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="person" size={20} color={T.text3} />
              </div>
              <span style={{ fontSize: 13, color: T.text3, textAlign: "center", lineHeight: 1.6 }}>
                로그인 후<br />이용해주세요
              </span>
            </div>
          ) : !hasRooms ? (
            <div style={{
              width: "100%",
              height: "100%",
              background: T.surface2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              border: `1.5px dashed ${T.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="plus" size={18} color={T.text3} />
              </div>
              <span style={{ fontSize: 12, color: T.text3, textAlign: "center", lineHeight: 1.5 }}>
                스터디방<br />참여하기
              </span>
            </div>
          ) : curRoom ? (
            <div
              onClick={() => setModalRoom({
                id: curRoom.id,
                title: curRoom.title,
                cat: "개발·IT",
                time: "—",
                members: curRoom.members,
                max: curRoom.max,
                img: curRoom.img,
                live: curRoom.live,
                type: "FREE",
              })}
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <img src={curRoom.img} alt={curRoom.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)",
              }} />
              {curRoom.live && (
                <div style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: T.red,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 4,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: "50%", background: "#fff",
                    display: "inline-block",
                    animation: "blink 1.2s ease-in-out infinite",
                  }} />
                  LIVE
                </div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                  <Icon name="users" size={10} color="rgba(255,255,255,.8)" />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.8)" }}>
                    {curRoom.members}/{curRoom.max}명
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 7,
                }}>
                  {curRoom.title}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`"${curRoom.title}" 스터디룸으로 이동합니다.`);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 5,
                    border: "1.5px solid rgba(255,255,255,.6)",
                    background: "rgba(255,255,255,.15)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    backdropFilter: "blur(4px)",
                    cursor: "pointer",
                  }}
                >
                  입장하기 →
                </button>
              </div>
              {rooms.length > 1 && (
                <div style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,.45)",
                  borderRadius: 10,
                  padding: "2px 7px",
                  fontSize: 10,
                  color: "#fff",
                  fontWeight: 600,
                }}>
                  {Math.min(myIdx, rooms.length - 1) + 1}/{rooms.length}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 오른쪽: 스탯 */}
      <div style={{
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        padding: "18px 20px 12px",
        boxShadow: T.shadow,
        transition: "background 0.25s,border-color 0.25s",
      }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>오늘 공부한 시간</div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 26,
            fontWeight: 600,
            color: T.red,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 18,
          }}>
            {h}
            <span style={{ fontSize: 14, color: T.text3, fontWeight: 400, marginLeft: 2 }}>시간</span>{" "}
            {m}
            <span style={{ fontSize: 14, color: T.text3, fontWeight: 400, marginLeft: 2 }}>분</span>
          </div>
          <div style={{
            height: 8,
            background: T.bg,
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg,${T.red},#FF7043)`,
              borderRadius: 4,
              transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ marginTop: 5 }}>
            <span style={{ fontSize: 11, color: T.text2, fontWeight: 500 }}>오늘 {h}h</span>
          </div>
        </div>

        <div style={{ height: 1, background: T.border, marginBottom: 10 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* 내 각오 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>내 각오</span>
              <button
                onClick={() => {
                  if (editRes) { setRes(resDraft); setEditRes(false); }
                  else { setResDraft(res); setEditRes(true); }
                  scrollToStudy();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  color: T.text3,
                  cursor: "pointer",
                }}
              >
                <Icon name={editRes ? "check" : "edit"} size={11} color={T.text3} />
                {editRes ? "저장" : "설정"}
              </button>
            </div>
            {editRes ? (
              <input
                value={resDraft}
                onChange={(e) => setResDraft(e.target.value)}
                style={{
                  width: "100%",
                  border: `1.5px solid ${T.red}`,
                  borderRadius: 5,
                  padding: "6px 8px",
                  fontSize: 12,
                  outline: "none",
                  background: T.surface,
                  color: T.text,
                  fontFamily: "'Noto Sans KR',sans-serif",
                }}
              />
            ) : (
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.5 }}>{res}</div>
            )}
          </div>

          {/* 내 디데이 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>내 디데이</span>
              <button
                onClick={() => {
                  if (editDday) {
                    setDdayNum(ddayNumD);
                    setDdayName(ddayNameD);
                    setEditDday(false);
                  } else {
                    setDdayNumD(ddayNum);
                    setDdayNameD(ddayName);
                    setEditDday(true);
                  }
                  scrollToStudy();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  color: T.text3,
                  cursor: "pointer",
                }}
              >
                <Icon name={editDday ? "check" : "edit"} size={11} color={T.text3} />
                {editDday ? "저장" : "설정"}
              </button>
            </div>
            {editDday ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <input
                  value={ddayNumD}
                  onChange={(e) => setDdayNumD(Number(e.target.value))}
                  type="number"
                  placeholder="D-?"
                  style={{
                    width: "100%",
                    border: `1.5px solid ${T.red}`,
                    borderRadius: 5,
                    padding: "5px 8px",
                    fontSize: 12,
                    outline: "none",
                    background: T.surface,
                    color: T.text,
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                />
                <input
                  value={ddayNameD}
                  onChange={(e) => setDdayNameD(e.target.value)}
                  placeholder="시험 이름"
                  style={{
                    width: "100%",
                    border: `1.5px solid ${T.red}`,
                    borderRadius: 5,
                    padding: "5px 8px",
                    fontSize: 12,
                    outline: "none",
                    background: T.surface,
                    color: T.text,
                    fontFamily: "'Noto Sans KR',sans-serif",
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: T.red,
                  color: "#fff",
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 700,
                  fontSize: 17,
                  flexShrink: 0,
                  lineHeight: 1.2,
                }}>
                  D-{ddayNum}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, lineHeight: 1.4 }}>{ddayName}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
