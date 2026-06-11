import { useRef, useState } from "react";
import { useRT } from "@/theme";
import { Icon } from "@/components/ui/Icon";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface ThumbnailUploaderProps {
  value: string | null;
  /** onChange: 화면에 보여줄 임시 미리보기 URL 전달 */
  onChange: (next: string | null) => void;
  /** onFileChange: 실제 API로 전송할 File 객체 전달 */
  onFileChange?: (file: File | null) => void;
  isMobile: boolean;
}

export function ThumbnailUploader({ value, onChange, onFileChange, isMobile }: ThumbnailUploaderProps) {
  const T = useRT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("JPG, JPEG, PNG 형식의 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError("파일 용량은 최대 5MB까지 업로드 가능합니다.");
      return;
    }
    setFileError("");
    /** 이전 미리보기 URL 해제 (파일 여러번 바꿀 떄) */
    if (value?.startsWith("blob:")) {
      URL.revokeObjectURL(value);
    }

    const previewUrl = URL.createObjectURL(file);

    onChange(previewUrl);
    onFileChange?.(file);
  };

  const handleClick = () => {
    setFileError("");
    inputRef.current?.click();
  };

  const thumbW: string | number = isMobile ? 260 : 240;
  const thumbH: number | undefined = isMobile ? 195 : 180;

  return (
    <div>
      <div
        onClick={() => !value && handleClick()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          position: "relative",
          width: thumbW,
          height: thumbH,
          aspectRatio: "4 / 3",
          flexShrink: 0,
          borderRadius: 10,
          overflow: "hidden",
          border: drag
            ? `1.5px dashed ${T.red}`
            : fileError
            ? `1.5px dashed ${T.red}`
            : value
            ? "none"
            : `1.5px dashed ${T.muted2}`,
          background: value ? "transparent" : T.surface3,
          cursor: value ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s",
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="대표 이미지 미리보기"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)",
            }} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(0,0,0,0.6)",
                border: `1px solid rgba(255,255,255,0.2)`,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Icon name="edit" size={12} color="#fff" /> 이미지 변경
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                /** 미리보기 해제 */
                if (value?.startsWith("blob:")) {
                  URL.revokeObjectURL(value);
                }

                onChange(null);
                onFileChange?.(null);
                setFileError("");
                /** 삭제 시 input 값 초기화
                 * : 이미 선택한 파일을 삭제한 뒤 같은 파일 다시 고를 때
                 */
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="x" size={12} color="#fff" />
            </button>
          </>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}>
            <Icon name="image" size={24} color={T.muted2} />
            <p style={{ margin: "8px 0 3px", fontSize: 12, fontWeight: 600, color: T.muted }}>
              이미지 추가
            </p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted2 }}>
              클릭 또는 드래그 · JPG, PNG · 최대 5MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            /** 새 파일 선택 후에도 초기화 */
            e.target.value = "";
          }}
        />
      </div>
      {fileError && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: T.red }}>{fileError}</p>
      )}
      {!value && !fileError && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: T.muted }}>
          미등록 시 기본 이미지가 사용됩니다.
        </p>
      )}
    </div>
  );
}
