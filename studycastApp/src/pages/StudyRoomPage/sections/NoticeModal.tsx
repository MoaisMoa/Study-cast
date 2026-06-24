import { useState } from "react";
import { useT } from "@/theme";
import { XIc, BellIc } from "../components/RoomIcons";

export interface NoticeModalProps {
  onClose: () => void;
  /** 성공하면 true, 저장/삭제 실패 시 false를 반환 */
  onNoticePost: (msg: string | null) => Promise<boolean>;
  noticeMsg: string | null;
  isHost: boolean;
}

export function NoticeModal({ onClose, onNoticePost, noticeMsg, isHost }: NoticeModalProps) {
  const T = useT();
  const [editMode, setEditMode] = useState(!noticeMsg && isHost);
  const [draft, setDraft] = useState(noticeMsg ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const greenBg = T.dark ? "rgba(76,175,80,.14)" : "#E8F5E9";
  const greenBorder = T.dark ? "rgba(76,175,80,.4)" : "#A5D6A7";
  const greenText = "#2e7d32";
  const noticeText = T.dark ? "#A5D6A7" : "#1B5E20";

  const handleSave = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    setError("");
    const ok = await onNoticePost(draft.trim());
    setPosting(false);
    if (ok) setEditMode(false);
    else setError("공지 저장에 실패했습니다. 다시 시도해주세요.");
  };
  const handleDelete = async () => {
    setPosting(true);
    setError("");
    const ok = await onNoticePost(null);
    setPosting(false);
    setConfirmDel(false);
    if (ok) onClose();
    else setError("공지 삭제에 실패했습니다. 다시 시도해주세요.");
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 16, width: 460, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* 헤더 — 빨간 종 아이콘 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BellIc s={18} c={T.red} />
            <span style={{ fontWeight: 700, fontSize: 17, color: T.text }}>공지사항</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.text3, padding: 4 }}><XIc s={18} c={T.text3} /></button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 조회 모드 */}
          {!editMode && (
            noticeMsg ? (
              <>
                {/* 현재 공지 — 녹색 박스 */}
                <div style={{ background: greenBg, border: `1px solid ${greenBorder}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: greenText, marginBottom: 8, letterSpacing: ".05em" }}>📢 현재 공지</div>
                  <div style={{ fontSize: 14, color: noticeText, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{noticeMsg}</div>
                </div>
                {/* HOST만 수정·삭제 */}
                {isHost && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setDraft(noticeMsg); setEditMode(true); }}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      수정
                    </button>
                    <button onClick={() => setConfirmDel(true)}
                      style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.dark ? "rgba(239,83,80,.4)" : "#FFCDD2"}`, background: T.redLight, color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      삭제
                    </button>
                  </div>
                )}
                {/* 삭제 확인 */}
                {confirmDel && (
                  <div style={{ background: T.dark ? "rgba(255,152,0,.12)" : "#FFF3E0", border: `1px solid ${T.dark ? "rgba(255,152,0,.4)" : "#FFB74D"}`, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 13, color: "#E65100", fontWeight: 500 }}>공지사항을 삭제하시겠습니까?</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setConfirmDel(false)}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        취소
                      </button>
                      <button onClick={handleDelete} disabled={posting}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", background: T.red, color: "#fff", fontSize: 12, fontWeight: 600, cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.7 : 1, fontFamily: "inherit" }}>
                        삭제 확인
                      </button>
                    </div>
                  </div>
                )}
                {error && !editMode && (
                  <div style={{ fontSize: 12, color: T.red }}>{error}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13, color: T.text3, textAlign: "center", padding: "16px 0", background: T.surface2, borderRadius: 8 }}>등록된 공지사항이 없습니다.</div>
            )
          )}

          {/* 편집 모드 (작성 / 수정) */}
          {editMode && (
            <>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text2 }}>{noticeMsg && draft === noticeMsg ? "공지 수정" : "공지 작성"}</div>
                  <span style={{ fontSize: 11, color: draft.length >= 500 ? T.red : T.text3, background: T.surface2, padding: "2px 8px", borderRadius: 6 }}>{draft.length}/500</span>
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} rows={6}
                  placeholder="공지사항을 입력하세요. (최대 500자)"
                  style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: T.text, resize: "vertical", outline: "none", lineHeight: 1.6, background: T.surface2, boxSizing: "border-box" }}
                  onFocus={(e) => { e.target.style.borderColor = T.red; }}
                  onBlur={(e) => { e.target.style.borderColor = T.border; }} />
              </div>
              {error && (
                <div style={{ fontSize: 12, color: T.red }}>{error}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (noticeMsg) setEditMode(false); else onClose(); }} disabled={posting}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 14, fontWeight: 600, cursor: posting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  취소
                </button>
                <button onClick={handleSave} disabled={!draft.trim() || posting}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "none", background: draft.trim() ? T.red : T.surface2, color: draft.trim() ? "#fff" : T.text3, fontSize: 14, fontWeight: 600, cursor: draft.trim() && !posting ? "pointer" : "not-allowed", opacity: posting ? 0.7 : 1, fontFamily: "inherit" }}>
                  {posting ? "저장 중..." : "저장"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
