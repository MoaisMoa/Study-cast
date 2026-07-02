import { useState } from "react";
import { useT } from "@/theme";
import type { RoomCategory } from "@/types";
import { ROOM_CATEGORY_NO } from "@/types";
import { CATS_FILTER } from "@/data/categories";
import { XIc, PlusIc } from "../components/RoomIcons";
import { getDefaultRoomImage } from "@/utils/roomImage";
import { updateRoom } from "@/services/studyRoomService";
import { broadcastRoomJoined } from "@/utils/roomSession";

const NO_TO_CAT = Object.fromEntries(
  Object.entries(ROOM_CATEGORY_NO).map(([k, v]) => [v, k as RoomCategory])
) as Record<number, RoomCategory>;

export interface SettingModalProps {
  onClose: () => void;
  isHost: boolean;
  roomTitle: string;
  setRoomTitle: (v: string) => void;
  settingCamOn: boolean;
  setSettingCamOn: (v: boolean) => void;
  settingMicOn: boolean;
  setSettingMicOn: (v: boolean) => void;
  maxMembers: number;
  setMaxMembers: (v: number) => void;
  roomThumbnail?: string | null;
  setRoomThumbnail?: (v: string | null) => void;
  roomId?: string | number;
  categoryNo?: number;
  setCategoryNo?: (v: number) => void;
  expiredAt?: string;
  setExpiredAt?: (v: string) => void;
  roomNotice?: string | null;
  roomPrivate?: boolean;
}

const GREEN = "#2e7d32";

function Toggle({ on, set, color }: { on: boolean; set: (v: boolean) => void; color: string }) {
  return (
    <button onClick={() => set(!on)}
      style={{ position: "relative", width: 38, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: on ? color : "#c8c8c8", transition: "background .15s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
    </button>
  );
}

export function SettingModal(props: SettingModalProps) {
  const {
    onClose, isHost,
    roomTitle, setRoomTitle,
    settingCamOn, setSettingCamOn,
    settingMicOn, setSettingMicOn,
    maxMembers, setMaxMembers,
    roomThumbnail, setRoomThumbnail,
    roomId,
    categoryNo, setCategoryNo,
    expiredAt, setExpiredAt,
    roomNotice,
    roomPrivate = false,
  } = props;

  const T = useT();
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = (() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().slice(0, 10); })();

  const initCat = categoryNo ? NO_TO_CAT[categoryNo] : undefined;
  const initDate = expiredAt ? expiredAt.slice(0, 10) : "2026-08-01";

  const [title, setTitle] = useState(roomTitle);
  const [endDate2, setEndDate2] = useState(initDate);
  const [maxM, setMaxM] = useState(maxMembers);
  const [selCats, setSelCats] = useState<RoomCategory[]>(initCat ? [initCat] : []);
  const defaultImg = getDefaultRoomImage(roomTitle);
  const [imgSrc, setImgSrc] = useState<string>(roomThumbnail ?? defaultImg);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgName, setImgName] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | "success" | "error">(null);
  const [errMsg, setErrMsg] = useState("");

  const dday = (() => {
    const [ey, em, ed] = endDate2.split("-").map(Number);
    const end = new Date(ey, em - 1, ed);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.min(90, Math.ceil((end.getTime() - now.getTime()) / 86400000)));
  })();

  const greenBg = T.dark ? "rgba(76,175,80,.16)" : "#E8F5E9";

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) { setImgErr("JPG, JPEG, PNG 파일만 업로드 가능합니다."); return; }
    if (file.size > 5 * 1024 * 1024) { setImgErr("파일 크기는 최대 5MB까지 업로드 가능합니다."); return; }
    setImgErr(""); setImgName(file.name); setImgFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImgSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!roomId) return;
    if (title.trim().length < 2) { setErrMsg("스터디방 제목은 최소 2자 이상 입력해주세요."); setSaveStatus("error"); return; }
    if (title.trim().length > 10) { setErrMsg("스터디방 제목은 최대 10자까지 입력 가능합니다."); setSaveStatus("error"); return; }
    if (selCats.length !== 1) { setErrMsg("카테고리를 1개 선택해주세요."); setSaveStatus("error"); return; }

    setSaving(true); setErrMsg(""); setSaveStatus(null);
    try {
      const result = await updateRoom(String(roomId), {
        roomTitle: title.trim(),
        maxUsers: maxM,
        categoryNo: ROOM_CATEGORY_NO[selCats[0]],
        expiredAt: endDate2,
        cameraStatus: settingCamOn,
        micStatus: settingMicOn,
        roomNotice: roomNotice ?? null,
      }, imgFile);

      setRoomTitle(title.trim());
      setMaxMembers(maxM);
      setRoomThumbnail?.(result.thumbnail);
      setCategoryNo?.(ROOM_CATEGORY_NO[selCats[0]]);
      setExpiredAt?.(endDate2);
      if (result.thumbnail) setImgSrc(result.thumbnail);
      setImgFile(null);
      broadcastRoomJoined(); // 메인페이지 등 다른 탭의 방 카드(제목/카테고리/썸네일 등) 새로고침 트리거

      setSaveStatus("success");
      window.setTimeout(() => { setSaveStatus(null); onClose(); }, 1500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "설정 저장 중 오류가 발생했습니다.";
      setErrMsg(msg); setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const ro: React.CSSProperties = isHost ? {} : { pointerEvents: "none", opacity: 0.6 };
  const sec: React.CSSProperties = { padding: "16px 22px", borderBottom: `1px solid ${T.border}` };
  const slabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 10 };
  const skey: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: T.text };
  const srow: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 16, width: "min(460px,96vw)", maxHeight: "92dvh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.3)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: T.text }}>스터디 설정</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.text3, padding: 4 }}><XIc s={18} c={T.text3} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* 대표 이미지 */}
          <div style={{ ...sec, ...ro }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ ...slabel, marginBottom: 0 }}>대표 이미지</div>
              {isHost && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 500, color: T.text2, cursor: "pointer" }}>
                  <PlusIc s={11} c={T.text2} />이미지 변경
                  <input type="file" accept=".jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleImg} />
                </label>
              )}
            </div>
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <img src={imgSrc} alt="대표 이미지" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {isHost && (
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 11, color: T.text3 }}>JPG, JPEG, PNG · 최대 5MB</div>
                {imgName && <div style={{ fontSize: 11, color: T.text2 }}>{imgName}</div>}
                {imgErr && <div style={{ fontSize: 12, color: T.red }}>{imgErr}</div>}
              </div>
            )}
          </div>

          {/* 스터디방 제목 */}
          <div style={{ ...sec, ...ro }}>
            <div style={slabel}>스터디방 제목</div>
            <div style={{ position: "relative" }}>
              <input value={title} onChange={(e) => { if (e.target.value.length <= 10) setTitle(e.target.value); }} placeholder="2~10자 입력" readOnly={!isHost}
                style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${saveStatus === "error" && (title.trim().length < 2 || title.trim().length > 10) ? T.red : T.border}`, borderRadius: 8, padding: "9px 40px 9px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", background: isHost ? T.bg : T.surface2 }}
                onFocus={(e) => { if (isHost) e.target.style.borderColor = T.red; }}
                onBlur={(e) => (e.target.style.borderColor = T.border)} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: title.length >= 10 ? T.red : T.text3 }}>{title.length}/10</span>
            </div>
          </div>

          {/* 기간 */}
          <div style={{ ...sec, ...ro }}>
            <div style={slabel}>기간</div>
            <div style={srow}>
              <div>
                <div style={skey}>종료일</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>오늘부터 최대 90일</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: T.red, background: T.redLight, padding: "4px 10px", borderRadius: 7, minWidth: 52, textAlign: "center", flexShrink: 0 }}>D-{dday}</span>
                <input type="date" value={endDate2} min={today} max={maxDate} onChange={(e) => setEndDate2(e.target.value)}
                  style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 13, fontFamily: "inherit", color: T.text, outline: "none", background: T.bg, colorScheme: T.dark ? "dark" : "light", cursor: isHost ? "pointer" : "default" }} />
              </div>
            </div>
          </div>

          {/* 스터디 인원 */}
          <div style={{ ...sec, ...ro }}>
            <div style={slabel}>스터디 인원</div>
            <div style={srow}>
              <div>
                <div style={skey}>참가 인원</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>최대 4인까지 설정 가능</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => { if (isHost) setMaxM((v) => Math.max(2, v - 1)); }} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: "none", cursor: isHost ? "pointer" : "default", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", color: T.text2 }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 32, textAlign: "center", color: T.text }}>{maxM}명</span>
                <button onClick={() => { if (isHost) setMaxM((v) => Math.min(4, v + 1)); }} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`, background: "none", cursor: isHost ? "pointer" : "default", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", color: T.text2 }}>+</button>
              </div>
            </div>
          </div>

          {/* 공개 여부 — 변경 불가 */}
          <div style={sec}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ ...slabel, marginBottom: 0 }}>공개 여부</div>
              <span style={{ fontSize: 10, color: T.text3, background: T.surface2, padding: "2px 8px", borderRadius: 5 }}>변경 불가</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {([false, true] as const).map((isPrivate) => {
                const label = isPrivate ? "비공개" : "공개";
                const selected = roomPrivate === isPrivate;
                return (
                  <div key={label} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${selected ? T.text2 : T.border}`, background: selected ? T.surface2 : "none", color: selected ? T.text2 : T.text3, fontWeight: selected ? 700 : 400, fontSize: 13, textAlign: "center", opacity: selected ? 1 : 0.4 }}>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카테고리 — 1개 선택 */}
          <div style={{ ...sec, ...ro }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ ...slabel, marginBottom: 0 }}>카테고리</div>
              <span style={{ fontSize: 10, color: T.text3, background: T.surface2, padding: "2px 8px", borderRadius: 5 }}>1개 선택</span>
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {CATS_FILTER.map((c) => {
                const seld = selCats.includes(c);
                return (
                  <button key={c} onClick={() => { if (isHost) setSelCats(seld ? [] : [c]); }}
                    style={{ flexShrink: 0, whiteSpace: "nowrap", padding: "6px 13px", borderRadius: 6, border: `1px solid ${seld ? T.red : T.border}`, background: seld ? T.red : "none", color: seld ? "#fff" : T.text2, fontWeight: seld ? 600 : 400, fontSize: 13, cursor: isHost ? "pointer" : "default", fontFamily: "inherit", transition: "all 120ms" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 초기 장치 설정 — 모든 멤버 변경 가능 */}
          <div style={{ ...sec, borderBottom: "none" }}>
            <div style={slabel}>초기 장치 설정</div>
            <div style={{ ...srow, marginBottom: 14 }}>
              <div><div style={skey}>카메라</div><div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{settingCamOn ? "입장 시 켜짐" : "입장 시 꺼짐"}</div></div>
              <Toggle on={settingCamOn} set={setSettingCamOn} color={T.red} />
            </div>
            <div style={srow}>
              <div><div style={skey}>마이크</div><div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{settingMicOn ? "입장 시 켜짐" : "입장 시 꺼짐"}</div></div>
              <Toggle on={settingMicOn} set={setSettingMicOn} color={T.red} />
            </div>
          </div>
        </div>

        {/* 저장 */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          {saveStatus === "success" && (
            <div style={{ background: greenBg, border: `1px solid ${T.dark ? "rgba(76,175,80,.4)" : "#A5D6A7"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: GREEN, fontWeight: 500, textAlign: "center" }}>✅ 스터디 그룹 정보가 수정되었습니다.</div>
          )}
          {saveStatus === "error" && errMsg && (
            <div style={{ background: T.redLight, border: `1px solid ${T.dark ? "rgba(229,57,53,.4)" : "#FFCDD2"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.red, fontWeight: 500, textAlign: "center" }}>⚠️ {errMsg}</div>
          )}
          {isHost
            ? <button onClick={handleSave} disabled={saving || saveStatus === "success"} style={{ width: "100%", padding: "11px 0", borderRadius: 9, border: "none", background: T.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving || saveStatus === "success" ? "not-allowed" : "pointer", opacity: saving || saveStatus === "success" ? 0.7 : 1, fontFamily: "inherit" }}>
                {saving ? "저장 중..." : saveStatus === "success" ? "저장 완료" : "저장"}
              </button>
            : <div style={{ fontSize: 12, color: T.text3, textAlign: "center", padding: "4px 0" }}>설정 변경은 HOST만 가능합니다.</div>}
        </div>
      </div>
    </div>
  );
}
