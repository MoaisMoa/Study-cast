import { useRT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import { Dialog } from "@/components/ui/Modal";
import { calcDays } from "@/utils/date";

export interface SubmitConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCreating: boolean;
  createError: string;
  thumbnail: string | null;
  name: string;
  visibility: "public" | "private";
  count: number;
  startDate: string;
  endDate: string;
  camOn: boolean;
  micOn: boolean;
  /** 관심 카테고리 — 비어있으면 행 자체를 숨김 */
  categories: string[];
}

export function SubmitConfirmModal(props: SubmitConfirmModalProps) {
  const T = useRT();
  const {
    open, onClose, onConfirm, isCreating, createError,
    thumbnail, name, visibility, count, startDate, endDate, camOn, micOn,
    categories,
  } = props;

  const days = calcDays(startDate, endDate);
  const rows: Array<[string, string]> = [
    ["이름", name],
    ["공개 여부", visibility === "public" ? "공개" : "비공개"],
    ["최대 인원", `${count}명`],
    ["기간", `${startDate} ~ ${endDate}`],
    ["총 기간", `${days ?? 0}일`],
    ["카메라 / 마이크", `${camOn ? "ON" : "OFF"} / ${micOn ? "ON" : "OFF"}`],
    ...(categories.length > 0
      ? ([["카테고리", categories.join(", ")]] as Array<[string, string]>)
      : []),
  ];

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "28px 24px 20px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: T.text }}>
          스터디 방을 생성할까요?
        </p>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
          아래 내용으로 스터디 방이 생성됩니다.
        </p>

        <div style={{
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 14,
          aspectRatio: "16/9",
        }}>
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt="대표 이미지"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
              }} />
              <span style={{
                position: "absolute",
                bottom: 8,
                left: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}>
                {name}
              </span>
            </>
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: T.surface3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}>
              <Icon name="image" size={28} color={T.muted2} />
              <span style={{ fontSize: 11, color: T.muted2 }}>기본 이미지</span>
            </div>
          )}
        </div>

        <div style={{
          background: T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 20,
        }}>
          {rows.map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 14px",
                borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
              }}
            >
              <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>{label}</span>
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: T.text,
                textAlign: "right",
                marginLeft: 12,
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.muted,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isCreating}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: isCreating ? T.muted2 : T.red,
              color: "#fff",
              cursor: isCreating ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              minWidth: 80,
            }}
          >
            {isCreating ? "생성 중..." : "생성하기"}
          </button>
        </div>
        {createError && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: T.red, textAlign: "right" }}>
            {createError}
          </p>
        )}
      </div>
    </Dialog>
  );
}
