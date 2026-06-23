import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { ChatMessage, RoomMember, RoomModal, TimerState } from "@/types/studyRoom";
import { useT, useThemeCtx } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { fmtT, nowDate, nowT } from "@/data/studyRoom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRoom, leaveRoom, getTodayStudySeconds, accumulateStudySeconds, subscribeMembers, subscribeChat, sendMessage, MEMBER_COLORS, saveNotice, kickMember as svcKickMember, reportTimerTick, subscribeTimerUpdates, type MemberEvent } from "@/services/studyRoomService";
import { API_BASE_URL } from "@/services/apiClient";
import { registerSession, unregisterSession, broadcastRoomJoined } from "@/utils/roomSession";
import { useLiveKit } from "@/hooks/useLiveKit";
import { LearningPlannerModal } from "@/pages/MainPage/sections/planner/LearningPlannerModal";
import {
  Av, BellIc, CalIc, CamOff, CamOn, ChatIc, CogIc, ExitIc, ExpandIc, MenuIc, MicOff, MicOn, MoonIc, PauseIc, PlayIc, SendIc, ShrinkIc, SunIc, UsersIc, XIc,
} from "./components/RoomIcons";
import { KickConfirm, ExitConfirm } from "./components/Confirms";
import { CamGrid } from "./sections/CamGrid";
import { MobileCamGrid } from "./sections/MobileCamGrid";
import { RightPanel } from "./sections/RightPanel";
import { MobileChatDrawer, MobileMemberDrawer } from "./sections/MobileDrawers";
import { MemberModal } from "./sections/MemberModal";
import { SettingModal } from "./sections/SettingModal";
import { NoticeModal } from "./sections/NoticeModal";

export default function StudyRoomPage() {
  const T = useT();
  const { mode, toggle } = useThemeCtx();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  // "나" 식별 기준 — 화상화면/멤버관리/멤버목록/채팅 전체 공통
  const myUuid = user?.userUuid ?? "";
  // 비로그인 접근 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      // registerSession이 실행되지 못해 남은 "입장 중" 표시 정리 (다음 입장 시도가 막히지 않도록)
      unregisterSession();
      navigate("/login", { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  // 멤버/시간
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [elapsed, setElapsed] = useState<Record<number, number>>({});
  const [totalSec, setTotalSec] = useState(0);
  // 헤더(totalSec)는 "유저의 오늘 총 공부 시간" — 방 이동과 무관하게 유지
  // roomSec은 "이 방에서의 누적 시간" — 방 입장 시 0부터 시작, 화상화면/멤버에게 공유되는 값
  const [roomSec, setRoomSec] = useState(0);
  const [timerSec, setTimerSec] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("idle");

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [camWarn, setCamWarn] = useState(false);
  // 장치 권한/가용 오류 (null | "denied" | "unavailable")
  const [micError, setMicError] = useState<null | "denied" | "unavailable">(null);
  const [camError, setCamError] = useState<null | "denied" | "unavailable">(null);

  // 시계
  const [clk, setClk] = useState(nowT());
  const [dateStr, setDateStr] = useState(nowDate());

  // 레이아웃/모달
  const [full, setFull] = useState(false);
  const [sideHover, setSideHover] = useState(false);
  const sideHoverTimer = useRef<number | null>(null);
  // 나가기 버튼으로 이미 퇴장한 경우 pagehide에서 중복 호출 방지
  const exitedRef = useRef(false);
  // pagehide/주기적 저장 핸들러가 최신 totalSec을 읽을 수 있도록 ref로 추적
  const totalSecRef = useRef(0);
  // 마지막으로 DB에 저장(반영)된 totalSec 시점 — 이 값과 totalSecRef의 차이만큼만 추가 저장
  const lastSavedTotalRef = useRef(0);
  // 다른 탭의 강제 퇴장 요청(로그아웃)이 항상 최신 doExit을 호출하도록 ref로 추적
  const doExitRef = useRef<() => void>(() => {});
  // WebSocket 이벤트 핸들러에서 최신 members를 읽기 위한 ref
  const myUuidRef = useRef<string>("");
  const membersRef = useRef<RoomMember[]>([]);
  const [modal, setModal] = useState<RoomModal>(null);
  const [kickTarget, setKickTarget] = useState<RoomMember | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<null | "menu" | "chat" | "members">(null);

  // 방 정보
  const [isHost, setIsHost] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [roomPrivate, setRoomPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [settingCamOn, setSettingCamOn] = useState(true);
  const [settingMicOn, setSettingMicOn] = useState(true);
  const [roomThumbnail, setRoomThumbnail] = useState<string | null>(null);
  const [categoryNo, setCategoryNo] = useState(0);
  const [expiredAt, setExpiredAt] = useState("");
  const [kickedMsg, setKickedMsg] = useState<string | null>(null);

  // 채팅
  const [chatTab, setChatTab] = useState<"채팅" | "멤버">("채팅");
  const [inp, setInp] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 방 입장(/join) 완료 여부 — LiveKit 연결은 이게 true가 된 뒤에만 시작 (입장 전 토큰 발급 시도 방지)
  const [joined, setJoined] = useState(false);

  // API: 방 입장 처리 + 초기 데이터 로드
  useEffect(() => {
    if (!roomId || authLoading || !isLoggedIn) return;
    setJoined(false);
    setRoomSec(0);
    registerSession(roomId, () => doExitRef.current());
    let cancelled = false;
    Promise.all([
      fetchRoom(roomId, myUuid),
      getTodayStudySeconds(),
    ]).then(([snap, todaySeconds]) => {
      if (cancelled) return;
      setMembers(snap.members);
      myUuidRef.current = myUuid;
      membersRef.current = snap.members;
      setElapsed(Object.fromEntries(snap.members.map((m) => [m.id, m.sec])));
      setTotalSec(todaySeconds);
      totalSecRef.current = todaySeconds;
      lastSavedTotalRef.current = todaySeconds;
      setRoomTitle(snap.title);
      setMaxMembers(snap.maxMembers);
      setNoticeMsg(snap.notice);
      setIsHost(snap.isHost);
      setRoomPrivate(snap.isPrivate);
      setJoinCode(snap.joinCode);
      setMsgs(snap.messages);
      setCam(snap.camOn);
      setMic(snap.micOn);
      setSettingCamOn(snap.camOn);
      setSettingMicOn(snap.micOn);
      setRoomThumbnail(snap.thumbnail);
      setCategoryNo(snap.categoryNo);
      setExpiredAt(snap.expiredAt);
      // 입장(/join) 완료 — 이제부터 LiveKit 연결 시작 가능
      setJoined(true);
      // 메인페이지 등 다른 탭의 방 목록 새로고침 트리거
      broadcastRoomJoined();
    });
    return () => { cancelled = true; };
  }, [roomId, authLoading, isLoggedIn, myUuid]);

  // 시계 + 타이머
  useEffect(() => {
    const t = window.setInterval(() => {
      setClk(nowT());
      setDateStr(nowDate());
      if (timerState === "running") {
        setTimerSec((v) => v + 1);
        setTotalSec((v) => v + 1);
        setRoomSec((v) => v + 1);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [timerState]);

  // totalSec ref 동기화 (pagehide/주기적 저장 핸들러용)
  useEffect(() => { totalSecRef.current = totalSec; }, [totalSec]);

  // membersRef 동기화 (WebSocket 이벤트 핸들러가 최신 members를 읽을 수 있도록)
  useEffect(() => { membersRef.current = members; }, [members]);

  // 방에 머무는 동안 30초마다 누적 공부 시간 중간 저장 (탭/브라우저 비정상 종료 시 데이터 손실 방지)
  useEffect(() => {
    if (!roomId || !joined) return;
    const t = window.setInterval(() => {
      const delta = totalSecRef.current - lastSavedTotalRef.current;
      if (delta <= 0) return;
      lastSavedTotalRef.current = totalSecRef.current;
      accumulateStudySeconds(delta).catch(() => {
        // 저장 실패 시 다음 주기에 누적해서 재시도되도록 롤백
        lastSavedTotalRef.current -= delta;
      });
    }, 30000);
    return () => window.clearInterval(t);
  }, [roomId, joined]);

  // 이 방에서의 누적 타이머 1초 틱 브로드캐스트 (다른 멤버 화면에 실시간 반영, 방 단위 — 유저 총 공부시간인 totalSec과는 별개)
  useEffect(() => {
    if (!roomId || !joined || timerState !== "running") return;
    reportTimerTick(roomId, myUuidRef.current, (membersRef.current[0]?.sec ?? 0) + roomSec);
  }, [roomId, joined, timerState, roomSec]);

  // 다른 멤버의 누적 공부 타이머 실시간 구독
  useEffect(() => {
    if (!roomId || !joined) return;
    const unsub = subscribeTimerUpdates(roomId, ({ userUuid, totalSeconds }) => {
      if (userUuid === myUuidRef.current) return;
      const member = membersRef.current.find((m) => m.userUuid === userUuid);
      if (!member) return;
      setElapsed((prev) => ({ ...prev, [member.id]: totalSeconds }));
    });
    return unsub;
  }, [roomId, joined]);

  // 멤버 입퇴장 실시간 구독
  useEffect(() => {
    if (!roomId || authLoading || !isLoggedIn) return;
    const unsub = subscribeMembers(roomId, (event: MemberEvent) => {
      if (event.type === "JOINED") {
        if (event.userUuid === myUuidRef.current) return; // 자신 입장 이벤트 무시
        setMembers((prev) => {
          if (prev.some((m) => m.userUuid === event.userUuid)) return prev;
          const idx = prev.length;
          const newMember: RoomMember = {
            id: idx + 1,
            userUuid: event.userUuid ?? "",
            name: event.userName ?? "Unknown",
            short: (event.userName ?? "?").slice(0, 2),
            email: "",
            role: event.owner ? "HOST" : "MEMBER",
            color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
            sec: 0,
            joinedAtMs: Date.now(),
            mic: event.micStatus ?? false,
            cam: event.cameraStatus ?? true,
          };
          const next = [...prev, newMember];
          membersRef.current = next;
          return next;
        });
        setMsgs((prev) => [
          ...prev,
          { id: Date.now(), type: "system", text: `${event.userName ?? "누군가"}님이 입장했습니다.`, time: nowT() },
        ]);
      } else if (event.type === "LEFT") {
        const leaving = membersRef.current.find((m) => m.userUuid === event.userUuid);
        setMembers((prev) => {
          const next = prev.filter((m) => m.userUuid !== event.userUuid);
          membersRef.current = next;
          return next;
        });
        if (leaving) {
          setMsgs((prev) => [
            ...prev,
            { id: Date.now(), type: "system", text: `${leaving.name}님이 퇴장했습니다.`, time: nowT() },
          ]);
        }
      } else if (event.type === "KICKED") {
        if (event.userUuid === myUuidRef.current) {
          // 자신이 추방됨 → 퇴장 처리 없이 창 닫기
          window.close();
          return;
        }
        const kicked = membersRef.current.find((m) => m.userUuid === event.userUuid);
        setMembers((prev) => {
          const next = prev.filter((m) => m.userUuid !== event.userUuid);
          membersRef.current = next;
          return next;
        });
        if (kicked) {
          setMsgs((prev) => [
            ...prev,
            { id: Date.now(), type: "system", text: `${kicked.name}님이 추방되었습니다.`, time: nowT() },
          ]);
        }
      } else if (event.type === "NOTICE") {
        setNoticeMsg(event.notice ?? null);
      }
    });
    return unsub;
  }, [roomId, authLoading, isLoggedIn]);

  // 실시간 채팅 구독
  useEffect(() => {
    if (!roomId || authLoading || !isLoggedIn) return;
    const unsub = subscribeChat(
      roomId,
      () => myUuidRef.current,
      (msg) => setMsgs((prev) => [...prev, msg])
    );
    return unsub;
  }, [roomId, authLoading, isLoggedIn]);

  // 카메라 OFF 시 자동 일시정지
  useEffect(() => {
    if (!cam && timerState === "running") setTimerState("paused");
  }, [cam, timerState]);

  // LiveKit 연결 — 카메라/마이크 실제 연결 및 비디오 트랙 관리 (비로그인 상태에서는 연결 시도 안 함)
  const { videoTracks } = useLiveKit(
    joined ? roomId : undefined,
    cam,
    mic,
    (e) => setCamError(e),
    (e) => setMicError(e),
  );

  const handleTimerStart = () => { if (!cam) { setCamWarn(true); setTimeout(() => setCamWarn(false), 3000); return; } setTimerState("running"); };
  const handleTimerPause = () => setTimerState("paused");
  const handleTimerResume = () => { if (!cam) { setCamWarn(true); setTimeout(() => setCamWarn(false), 3000); return; } setTimerState("running"); };
  const handleTimerReset = () => { setTimerSec(0); setTimerState("idle"); };

  const send = async () => {
    if (!inp.trim()) { setSendError("메시지를 입력해주세요."); return; }
    if (inp.length > 50) { setSendError("메시지는 최대 50자까지 입력할 수 있습니다."); return; }
    if (isSending || !roomId) return;
    const text = inp.trim();
    setInp("");
    setSendError(null);
    setIsSending(true);
    try {
      await sendMessage(roomId, text, myUuidRef.current);
    } catch {
      setSendError("메시지 전송에 실패했습니다.");
      setInp(text);
    } finally {
      setIsSending(false);
    }
  };

  const doKick = async () => {
    if (!kickTarget || !roomId) return;
    setKickTarget(null);
    try {
      await svcKickMember(roomId, kickTarget.userUuid);
      // 추방 배너 표시 (멤버 목록 갱신은 KICKED WebSocket 이벤트가 처리)
      setKickedMsg(kickTarget.name);
      setTimeout(() => setKickedMsg(null), 3000);
    } catch {
      // 추방 실패 시 무시
    }
  };

  const doExit = async () => {
    setTimerState("idle");
    setShowExitConfirm(false);
    // 초기화 버튼을 눌렀어도 totalSec은 리셋되지 않으므로, 아직 저장 안 된 만큼만 정확히 전달
    const remaining = Math.max(0, totalSecRef.current - lastSavedTotalRef.current);
    try {
      await leaveRoom(roomId!, remaining);
      lastSavedTotalRef.current = totalSecRef.current;
      exitedRef.current = true;
      broadcastRoomJoined(); // 메인페이지 등 다른 탭의 "오늘 공부한 시간"/방 목록 새로고침 트리거
    } catch { /* ignore — pagehide fallback will handle cleanup */ }
    unregisterSession();
    window.close();
  };
  useEffect(() => { doExitRef.current = doExit; }, [doExit]);

  // 탭/브라우저 강제 종료 시 퇴장 처리
  // keepalive: true → 페이지 언로드 후에도 브라우저가 요청 완료를 보장
  const handlePageHide = useCallback(() => {
    if (exitedRef.current || !roomId) return;
    const remaining = Math.max(0, totalSecRef.current - lastSavedTotalRef.current);
    fetch(`${API_BASE_URL}/api/rooms/${roomId}/leave`, {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studiedSeconds: remaining }),
    });
    unregisterSession();
  }, [roomId]);

  useEffect(() => {
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [handlePageHide]);

  // 인증 확인 전/비로그인 시 렌더링 방지 — 리다이렉트는 위 useEffect가 처리
  if (authLoading || !isLoggedIn) return null;

  const handleSideEnter = () => { if (sideHoverTimer.current) window.clearTimeout(sideHoverTimer.current); setSideHover(true); };
  const handleSideLeave = () => { sideHoverTimer.current = window.setTimeout(() => setSideHover(false), 300); };

  const open = (key: RoomModal) => setModal((p) => (p === key ? null : key));
  // 모바일 드로우: "menu" | "chat" | "members" | null
  const timerAction = () => {
    if (!cam) return;
    if (timerState === "idle") handleTimerStart();
    else if (timerState === "running") handleTimerPause();
    else handleTimerResume();
  };
  const rightPanelProps = { chatTab, setChatTab, msgs, inp, setInp, send, isSending, sendError, setSendError, members, elapsed: { ...elapsed, 1: (members[0]?.sec ?? 0) + roomSec }, totalSec: roomSec, timerState, noticeMsg, myUuid, mic, cam, maxMembers, setNoticeMsg };

  // ── 공통 모달 묶음 ──
  const modals = (
    <>
      {modal === "cal" && <LearningPlannerModal open onClose={() => setModal(null)} />}
      {modal === "members" && <MemberModal roomId={roomId} members={members} elapsed={{ ...elapsed, 1: (members[0]?.sec ?? 0) + roomSec }} myUuid={myUuid} mic={mic} cam={cam} isHost={isHost} isPrivate={roomPrivate} joinCode={joinCode ?? undefined} onClose={() => setModal(null)} onKickRequest={setKickTarget} />}
      {modal === "settings" && <SettingModal onClose={() => setModal(null)} isHost={isHost} roomTitle={roomTitle} setRoomTitle={setRoomTitle} settingCamOn={settingCamOn} setSettingCamOn={setSettingCamOn} settingMicOn={settingMicOn} setSettingMicOn={setSettingMicOn} maxMembers={maxMembers} setMaxMembers={setMaxMembers} roomThumbnail={roomThumbnail} setRoomThumbnail={setRoomThumbnail} roomId={roomId} categoryNo={categoryNo} setCategoryNo={setCategoryNo} expiredAt={expiredAt} setExpiredAt={setExpiredAt} roomNotice={noticeMsg} roomPrivate={roomPrivate} />}
      {modal === "notice" && <NoticeModal onClose={() => setModal(null)} onNoticePost={async (msg) => { try { const r = await saveNotice(roomId!, msg); setNoticeMsg(r.notice); } catch { setNoticeMsg(msg); } }} noticeMsg={noticeMsg} isHost={isHost} />}
      {kickTarget && <KickConfirm member={kickTarget} onConfirm={doKick} onCancel={() => setKickTarget(null)} />}
      {showExitConfirm && <ExitConfirm onConfirm={doExit} onCancel={() => setShowExitConfirm(false)} />}
    </>
  );

  const camGridEl = (
    <CamGrid members={members} elapsed={elapsed} totalSec={roomSec} timerSec={timerSec} timerState={timerState}
      cam={cam} camError={!!camError} focusedId={focusedId} setFocusedId={setFocusedId}
      onTimerStart={handleTimerStart} onTimerPause={handleTimerPause} onTimerResume={handleTimerResume} onTimerReset={handleTimerReset}
      videoTracks={videoTracks} myUuid={myUuid} />
  );

  // 장치 오류 배너 (데스크탑/모바일 공용)
  const deviceBanners = (
    <>
      {micError && (
        <div style={{ flexShrink: 0, background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <MicOff s={14} c={T.text3} />
          <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>
            {micError === "unavailable" ? "마이크 장치를 확인해 주세요." : "마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요."}
          </span>
          <button onClick={() => setMicError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex" }}><XIc s={13} c={T.text3} /></button>
        </div>
      )}
      {camError && (
        <div style={{ flexShrink: 0, background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <CamOff s={14} c={T.text3} />
          <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>
            {camError === "unavailable" ? "카메라 장치를 확인해 주세요." : "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요."}
          </span>
          <button onClick={() => setCamError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex" }}><XIc s={13} c={T.text3} /></button>
        </div>
      )}
    </>
  );

  // ════════════════ 모바일 (드로어 방식 — 원본) ════════════════
  if (isMobile) {
    const chatBadge = msgs.filter((m) => m.type !== "system").length > 0;
    const cbtn: React.CSSProperties = { width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, position: "relative", overflow: "hidden", padding: 8, gap: 6 }}>
        {/* 헤더 — 둥근 카드 (햄버거 / 중앙 ON STUDY+타이머 / 우측 벽시계+나가기) */}
        <header style={{ flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "10px 14px", zIndex: 10 }}>
          <button onClick={() => setDrawer((d) => (d === "menu" ? null : "menu"))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", zIndex: 1 }}>
            <span style={{ width: 18, height: 2, borderRadius: 1, background: drawer === "menu" ? T.red : T.text2, display: "block", transition: "all 200ms" }} />
            <span style={{ width: 14, height: 2, borderRadius: 1, background: drawer === "menu" ? T.red : T.text2, display: "block", transition: "all 200ms" }} />
            <span style={{ width: 18, height: 2, borderRadius: 1, background: drawer === "menu" ? T.red : T.text2, display: "block", transition: "all 200ms" }} />
          </button>
          {/* 중앙 — absolute 완전 가운데 */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />
              <span style={{ color: T.text, fontWeight: 700, fontSize: 12, letterSpacing: ".04em" }}>ON STUDY</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: T.red, marginTop: 1 }}>{fmtT(totalSec)}</div>
          </div>
          {/* 우측 — 벽시계 + 나가기(텍스트) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", zIndex: 1 }}>
            <span style={{ color: T.text3, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{clk}</span>
            <button onClick={toggle} title={mode === "dark" ? "라이트 모드" : "다크 모드"}
              style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {mode === "dark" ? <SunIc s={15} c={T.text2} /> : <MoonIc s={15} c={T.text2} />}
            </button>
            <button onClick={() => setShowExitConfirm(true)}
              style={{ background: T.redLight, border: `1px solid ${T.dark ? "rgba(239,83,80,.4)" : "#FFCDD2"}`, borderRadius: 14, padding: "4px 10px", color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              <ExitIc s={12} c={T.red} />나가기
            </button>
          </div>
        </header>
        {deviceBanners}

        {/* 캠 그리드 (모바일 전용 4분할 확대/축소) */}
        <MobileCamGrid
          members={members} elapsed={{ ...elapsed, 1: (members[0]?.sec ?? 0) + roomSec }} totalSec={totalSec} timerSec={timerSec}
          timerState={timerState} cam={cam} mic={mic} focused={focusedId}
          setFocused={setFocusedId}
          onTimerToggle={timerAction} onTimerReset={handleTimerReset}
          videoTracks={videoTracks} myUuid={myUuid}
        />

        {/* 하단 컨트롤 바: 마이크 · 채팅 · 중앙 타이머 · 멤버 · 카메라 */}
        <div style={{ flexShrink: 0, padding: "12px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-around", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20 }}>
          <button onClick={() => setMic((v) => !v)} style={{ ...cbtn, background: mic ? T.redLight : T.surface2, position: "relative" }}>
            {mic ? <MicOn s={22} c={T.red} /> : <MicOff s={22} c={T.text3} />}
            {micError && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />}
          </button>
          <button onClick={() => setDrawer((d) => (d === "chat" ? null : "chat"))} style={{ ...cbtn, background: T.surface2, position: "relative" }}>
            <ChatIc s={22} c={drawer === "chat" ? T.red : T.text2} />
            {chatBadge && <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: T.red }} />}
          </button>
          {/* 중앙 타이머 — 카메라 OFF 시 비활성. 일시정지 시 위에 초기화 버튼 */}
          <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {timerState === "paused" && (
              <button onClick={handleTimerReset}
                style={{ position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", zIndex: 60, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "9px 16px", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 8" /></svg>
                초기화
              </button>
            )}
            <button onClick={timerAction} style={{ width: 56, height: 56, borderRadius: "50%", border: "none", cursor: cam ? "pointer" : "not-allowed", background: !cam ? T.surface2 : timerState === "running" ? T.red : timerState === "paused" ? "#FF7043" : T.red, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms", opacity: cam ? 1 : 0.35 }}>
              {timerState === "running" ? <PauseIc s={24} /> : <PlayIc s={24} />}
            </button>
          </div>
          <button onClick={() => setDrawer((d) => (d === "members" ? null : "members"))} style={{ ...cbtn, background: T.surface2 }}>
            <UsersIc s={22} c={drawer === "members" ? T.red : T.text2} />
          </button>
          <button onClick={() => setCam((v) => !v)} style={{ ...cbtn, background: cam ? T.redLight : T.surface2, position: "relative" }}>
            {cam ? <CamOn s={22} c={T.red} /> : <CamOff s={22} c={T.text3} />}
            {camError && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />}
          </button>
        </div>

        {/* 드로어 오버레이 */}
        {drawer && <div onClick={() => setDrawer(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 65 }} />}

        {/* 메뉴 드로어 */}
        {drawer === "menu" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 70, background: T.surface, borderRadius: "18px 18px 0 0", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", maxHeight: "70dvh", animation: "slideUp 240ms ease forwards" }}>
            <div onClick={() => setDrawer(null)} style={{ width: 36, height: 3, borderRadius: 2, background: T.borderStrong, margin: "10px auto 0", flexShrink: 0, cursor: "pointer" }} />
            <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ color: T.text, fontWeight: 700, fontSize: 20 }}>메뉴</span>
              <button onClick={() => setDrawer(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><XIc s={18} c={T.text3} /></button>
            </div>
            <div style={{ padding: "0 14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                ["members", "멤버 관리", <UsersIc s={20} c={T.red} />],
                ["cal", "캘린더", <CalIc s={20} c={T.red} />],
                ["notice", "공지사항", <BellIc s={20} c={T.red} />],
                ["settings", "설정", <CogIc s={20} c={T.red} />],
              ] as const).map(([key, label, icon]) => (
                <button key={key} onClick={() => { setDrawer(null); setModal(key as RoomModal); }}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}`, cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.redLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <span style={{ color: T.text, fontSize: 15, fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: T.text3, fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 채팅 드로어 */}
        {drawer === "chat" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 70, background: T.surface, borderRadius: "18px 18px 0 0", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "58dvh", animation: "slideUp 240ms ease forwards" }}>
            <div onClick={() => setDrawer(null)} style={{ width: 36, height: 3, borderRadius: 2, background: T.borderStrong, margin: "10px auto 0", flexShrink: 0, cursor: "pointer" }} />
            <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>채팅</span>
              <button onClick={() => setDrawer(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><XIc s={18} c={T.text3} /></button>
            </div>
            <MobileChatDrawer msgs={msgs} inp={inp} setInp={setInp} send={send} />
          </div>
        )}

        {/* 멤버 드로어 */}
        {drawer === "members" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 70, background: T.surface, borderRadius: "18px 18px 0 0", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", maxHeight: "60dvh", animation: "slideUp 240ms ease forwards" }}>
            <div onClick={() => setDrawer(null)} style={{ width: 36, height: 3, borderRadius: 2, background: T.borderStrong, margin: "10px auto 0", flexShrink: 0, cursor: "pointer" }} />
            <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>멤버 <span style={{ color: T.text3, fontWeight: 400, fontSize: 13 }}>{members.length}명</span></span>
              <button onClick={() => setDrawer(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><XIc s={18} c={T.text3} /></button>
            </div>
            <MobileMemberDrawer members={members} elapsed={{ ...elapsed, 1: (members[0]?.sec ?? 0) + roomSec }} totalSec={totalSec} timerState={timerState} mic={mic} cam={cam} myUuid={myUuid} />
          </div>
        )}

        {modals}
      </div>
    );
  }

  // ════════════════ 데스크탑 ════════════════
  const navBtn = (active: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? T.redLight : "none", position: "relative",
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text }}>
      {/* 헤더 */}
      <header style={{ height: 48, flexShrink: 0, display: "flex", alignItems: "center", background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 14px", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: T.red, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, letterSpacing: ".06em", flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "blink 1.2s ease-in-out infinite" }} />ON STUDY
        </div>
        <span style={{ fontSize: 13, color: T.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 4 }}>{roomTitle}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={toggle} title={mode === "dark" ? "라이트 모드" : "다크 모드"}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            {mode === "dark" ? <SunIc s={16} c={T.text2} /> : <MoonIc s={16} c={T.text2} />}
          </button>
          <span style={{ fontSize: 12, color: T.text2 }}>{dateStr}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.text3 }}>{clk}</span>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: T.red, fontWeight: 600 }}>{fmtT(totalSec)}</span>
          <Av name={user?.name ?? "나"} color={T.red} size={30} profileImage={user?.profileImage} />
        </div>
      </header>

      {/* 경고 배너 */}
      {camWarn && (
        <div style={{ flexShrink: 0, background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <CamOff s={14} c={T.text3} /><span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>카메라를 켠 후 공부 타이머를 시작할 수 있습니다.</span>
        </div>
      )}
      {deviceBanners}
      {kickedMsg && (
        <div style={{ flexShrink: 0, background: T.redLight, borderBottom: `1px solid ${T.border}`, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.red, fontWeight: 500 }}><b>{kickedMsg}</b> 님이 추방되었습니다.</span>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* 좌측 네비 */}
        <div style={{ width: 44, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 2 }}>
          <button style={navBtn(modal === "members")} title="멤버 관리" onClick={() => open("members")}><UsersIc s={18} c={modal === "members" ? T.red : T.text2} /></button>
          <button style={navBtn(modal === "cal")} title="캘린더" onClick={() => open("cal")}><CalIc s={18} c={modal === "cal" ? T.red : T.text2} /></button>
          <button style={navBtn(modal === "notice")} title="공지사항" onClick={() => open("notice")}><BellIc s={18} c={modal === "notice" ? T.red : T.text2} /></button>
          <button style={navBtn(modal === "settings")} title="설정" onClick={() => open("settings")}><CogIc s={18} c={modal === "settings" ? T.red : T.text2} /></button>
          <div style={{ flex: 1 }} />
          <div style={{ width: 20, height: 1, background: T.border, margin: "4px 0" }} />
          <button style={navBtn(false)} onClick={() => setMic((v) => !v)} title={mic ? "마이크 끄기" : "마이크 켜기"}>{mic ? <MicOn s={19} c={T.text2} /> : <MicOff s={19} c={T.text3} />}{micError && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: "2px solid " + T.surface }} />}</button>
          <button style={navBtn(false)} onClick={() => setCam((v) => !v)} title={cam ? "카메라 끄기" : "카메라 켜기"}>{cam ? <CamOn s={19} c={T.text2} /> : <CamOff s={19} c={T.text3} />}{camError && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: T.red, border: "2px solid " + T.surface }} />}</button>
          <button style={navBtn(false)} onClick={() => setFull((v) => !v)} title={full ? "축소" : "확대"}>{full ? <ShrinkIc s={19} c={T.text2} /> : <ExpandIc s={19} c={T.text2} />}</button>
          <div style={{ width: 20, height: 1, background: T.border, margin: "4px 0" }} />
          <button style={navBtn(false)} onClick={() => setShowExitConfirm(true)} title="나가기"><ExitIc s={18} c={T.red} /></button>
        </div>

        {/* 중앙 캠 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, position: "relative" }}>
          {camGridEl}
        </div>

        {/* 우측 패널 (축소 모드일 때만 고정) */}
        {!full && (
          <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", background: T.surface, borderLeft: `1px solid ${T.border}` }}>
            <RightPanel {...rightPanelProps} />
          </div>
        )}

        {/* 확대 모드: 우측 끝 hover → 슬라이드 패널 */}
        {full && (
          <>
            <div onMouseEnter={handleSideEnter} onMouseLeave={handleSideLeave}
              style={{ position: "fixed", top: 48, right: 0, width: 20, bottom: 0, zIndex: 200, cursor: "pointer" }} />
            {sideHover && (
              <div onMouseEnter={handleSideEnter} onMouseLeave={handleSideLeave}
                style={{ position: "fixed", top: 48, right: 0, bottom: 0, width: 280, zIndex: 201, boxShadow: "-4px 0 20px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", background: T.surface, borderLeft: `1px solid ${T.border}`, animation: "slideInRight 200ms ease forwards" }}>
                <RightPanel {...rightPanelProps} />
              </div>
            )}
          </>
        )}
      </div>

      {modals}
    </div>
  );
}