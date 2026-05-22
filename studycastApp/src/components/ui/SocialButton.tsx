import { useState } from "react";
import type { ReactNode } from "react";
import { useAT } from "@/theme";

export type SocialVariant = "kakao" | "google";

export interface SocialButtonProps {
  variant: SocialVariant;
  children: ReactNode;
  onClick?: () => void;
}

export function SocialButton({ variant, children, onClick }: SocialButtonProps) {
  const T = useAT();
  const [hover, setHover] = useState(false);

  const isKakao = variant === "kakao";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        padding: "11px 16px",
        border: `1.5px solid ${isKakao ? "#FEE500" : T.borderM}`,
        borderRadius: 10,
        background: isKakao
          ? hover ? "#f0d800" : "#FEE500"
          : hover ? T.bg : T.surface,
        color: isKakao ? "#191919" : T.text,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: T.sans,
        cursor: "pointer",
        transition: "all .15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {children}
    </button>
  );
}
