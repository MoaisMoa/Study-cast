import { useRef, useState } from "react";
import { useT } from "@/theme";
import { AVATAR_ALLOWED_TYPES } from "@/data/profile";

export interface AvatarSectionProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  /** 비밀번호 등록 여부 (false면 소셜 전용 계정 — 버튼 문구가 "비밀번호 등록"으로 바뀜) */
  hasPassword: boolean;
  onAvatarChange: (next: string | null) => void;
  onChangePasswordClick: () => void;
  isMobile: boolean;
}

/** 아바타 + 이름/이메일(읽기 전용) + 비밀번호 변경/등록 버튼 */
export function AvatarSection({
  name,
  email,
  avatarUrl,
  hasPassword,
  onAvatarChange,
  onChangePasswordClick,
  isMobile,
}: AvatarSectionProps) {
  const T = useT();
  const ff = "'Noto Sans KR', sans-serif";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("JPG, JPEG, PNG 형식의 파일만 업로드할 수 있습니다.");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") onAvatarChange(result);
    };
    reader.readAsDataURL(file);
  }

  function openPicker() {
    setAvatarError("");
    fileInputRef.current?.click();
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        marginBottom: 40,
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: avatarUrl ? T.border : T.red,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="프로필"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 33, fontFamily: ff, lineHeight: 1 }}>
              {name.charAt(0)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={openPicker}
          aria-label="프로필 사진 변경"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: T.text2,
            border: `2px solid ${T.bg}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="4" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.2" fill="none" />
            <circle cx="6" cy="7" r="1.5" stroke="#fff" strokeWidth="1.2" fill="none" />
            <path d="M4 4V3h4v1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: isMobile ? 17 : 20,
            fontWeight: 700,
            color: T.text,
            marginBottom: 2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 14,
            color: T.text2,
            marginBottom: avatarError ? 6 : 12,
            wordBreak: "break-all",
          }}
        >
          {email}
        </div>
        {avatarError && (
          <div style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>
            {avatarError}
          </div>
        )}
        <button
          type="button"
          onClick={onChangePasswordClick}
          style={{
            padding: "6px 14px",
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            background: T.surface,
            fontSize: 13,
            color: T.text2,
            cursor: "pointer",
            fontFamily: ff,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.red)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
        >
          {hasPassword ? "비밀번호 변경" : "비밀번호 등록"}
        </button>
      </div>
    </div>
  );
}
