import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { useRT } from "@/theme";
import { saveNotice } from "@/services/studyRoomService";

interface RoomNoticeModalProps {
  open: boolean;
  onClose: () => void;
  roomId: number;
  initialNotice: string;
  isHost: boolean;
  onUpdate: (notice: string | null) => void;
}

export function RoomNoticeModal({
  open,
  onClose,
  roomId,
  initialNotice,
  isHost,
  onUpdate,
}: RoomNoticeModalProps) {
  const T = useRT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotice ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(initialNotice ?? "");
      setEditing(false);
      setError("");
      setPending(false);
    }
  }, [open, initialNotice]);

  const handleSave = async () => {
    if (draft.length > 500) {
      setError("공지사항은 최대 500자까지 입력할 수 있습니다.");
      return;
    }
    setPending(true);
    try {
      const noticeValue = draft.trim() === "" ? null : draft.trim();
      const result = await saveNotice(String(roomId), noticeValue);
      onUpdate(result.notice ?? null);
      setEditing(false);
      setError("");
    } catch (e) {
      setError("공지사항 저장 중 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("공지사항을 삭제하시겠습니까?")) {
      return;
    }
    setPending(true);
    try {
      await saveNotice(String(roomId), null);
      onUpdate(null);
      setEditing(false);
      onClose();
    } catch (e) {
      setError("공지사항 삭제 중 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} width={520}>
      <div style={{
        background: T.surface,
        borderRadius: 18,
        padding: 26,
        border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>공지사항</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: T.text2 }}>해당 스터디룸의 공지를 확인하고 관리할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "none",
              background: T.surface2,
              color: T.text,
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={16} color={T.text} />
          </button>
        </div>

        <div style={{
          minHeight: 180,
          padding: 18,
          borderRadius: 14,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          marginBottom: 16,
        }}>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value.length <= 500) setError("");
              }}
              placeholder="공지사항을 입력하세요. 최대 500자까지 등록 가능합니다."
              style={{
                width: "100%",
                minHeight: 140,
                fontSize: 14,
                lineHeight: 1.7,
                color: T.text,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "vertical",
              }}
              maxLength={500}
            />
          ) : (
            <p style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              color: initialNotice ? T.text : T.text2,
              lineHeight: 1.8,
              fontSize: 14,
            }}>
              {initialNotice || "등록된 공지사항이 없습니다."}
            </p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.text2 }}>
              {draft.length} / 500
            </span>
            {error && <span style={{ fontSize: 12, color: "#d23f44" }}>{error}</span>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isHost && !editing && initialNotice && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text,
                  cursor: "pointer",
                }}
              >
                수정
              </button>
            )}
            {isHost && initialNotice && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.red,
                  cursor: "pointer",
                }}
                disabled={pending}
              >
                삭제
              </button>
            )}
            {isHost && editing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(initialNotice ?? "");
                    setError("");
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.text,
                    cursor: "pointer",
                  }}
                  disabled={pending}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: T.red,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  disabled={pending}
                >
                  저장
                </button>
              </>
            )}
            {!editing && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text,
                  cursor: "pointer",
                }}
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
