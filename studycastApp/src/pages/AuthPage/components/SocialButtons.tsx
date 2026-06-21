import { useLocation } from "react-router-dom";
import { useAT } from "@/theme";
import { SocialButton } from "@/components/ui/SocialButton";
import { API_BASE_URL } from "@/services/apiClient";

export interface SocialButtonsProps {
  label?: string;
}

/** 카카오 + 구글 OAuth 버튼 묶음 */
export function SocialButtons({ label = "계속하기" }: SocialButtonsProps) {
  const T = useAT();
  const location = useLocation();

  // /login?redirect=/rooms/123로 들어온 경우, 소셜 로그인 후에도 같은 곳으로 이어지도록 전달
  function buildOAuthUrl(provider: "kakao" | "google"): string {
    const redirect = new URLSearchParams(location.search).get("redirect");
    const query = redirect && redirect.startsWith("/") ? `?redirect=${encodeURIComponent(redirect)}` : "";
    return `${API_BASE_URL}/oauth2/authorization/${provider}${query}`;
  }

  function handleKakao() {
    window.location.href = buildOAuthUrl("kakao");
  }

  function handleGoogle() {
    window.location.href = buildOAuthUrl("google");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SocialButton variant="kakao" onClick={handleKakao}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.1 1.29 3.94 3.24 5.01l-.83 3.1c-.07.27.22.49.46.34L8.1 13.8c.29.03.59.05.9.05 4.14 0 7.5-2.69 7.5-6s-3.36-6-7.5-6z"
            fill="#191919"
          />
        </svg>
        카카오로 {label}
      </SocialButton>
      <SocialButton variant="google" onClick={handleGoogle}>
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M16.51 8H9.09v2.87h4.2c-.19 1-.76 1.85-1.62 2.41v2h2.61c1.53-1.41 2.41-3.49 2.41-5.94 0-.4-.04-.79-.18-1.34z" fill="#4285F4" />
          <path d="M9.09 17c2.19 0 4.03-.72 5.37-1.96l-2.61-2c-.73.49-1.66.78-2.76.78-2.12 0-3.92-1.43-4.56-3.36H1.83v2.07C3.16 15.28 5.96 17 9.09 17z" fill="#34A853" />
          <path d="M4.53 10.46A5.08 5.08 0 0 1 4.27 9c0-.51.09-1.01.26-1.46V5.47H1.83A8.03 8.03 0 0 0 1 9c0 1.28.31 2.5.83 3.53l2.7-2.07z" fill="#FBBC05" />
          <path d="M9.09 3.58c1.19 0 2.26.41 3.1 1.21l2.32-2.32A7.88 7.88 0 0 0 9.09 1C5.96 1 3.16 2.72 1.83 5.47l2.7 2.07c.64-1.93 2.44-3.36 4.56-3.36z" fill="#EA4335" />
        </svg>
        Google로 {label}
      </SocialButton>
    </div>
  );
}
