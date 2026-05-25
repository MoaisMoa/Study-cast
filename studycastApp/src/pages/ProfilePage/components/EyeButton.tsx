interface EyeButtonProps {
  visible: boolean;
  onToggle: () => void;
}

/** 비밀번호 input 우측에 절대 위치로 들어가는 보기/숨기기 토글 */
export function EyeButton({ visible, onToggle }: EyeButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        color: "#adb5bd",
      }}
    >
      {visible ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
          <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
    </button>
  );
}
