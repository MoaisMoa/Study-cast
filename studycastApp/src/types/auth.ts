export type AuthScreen = "login" | "signup" | "find-pw" | "verify" | "reset";

export interface AuthNavigateMeta {
  email?: string;
}

export type AuthNavigate = (screen: AuthScreen, meta?: AuthNavigateMeta) => void;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface FindPwPayload {
  email: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface ResetPwPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
}
