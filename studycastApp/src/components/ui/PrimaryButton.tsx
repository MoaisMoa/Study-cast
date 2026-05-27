import { useState } from "react";
import type { ReactNode } from "react";
import { useAT } from "@/theme";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: PrimaryButtonProps) {
  const T = useAT();
  const [hover, setHover] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        padding: "13px",
        background: hover && !disabled ? T.redH : T.red,
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: T.sans,
        letterSpacing: ".2px",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .15s",
      }}
    >
      {children}
    </button>
  );
}
