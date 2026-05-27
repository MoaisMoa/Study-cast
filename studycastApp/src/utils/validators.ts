export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** 영문자+숫자+특수문자 포함 8~16자 (회원가입용) */
export const isPwValidStrict = (v: string): boolean =>
  v.length >= 8 &&
  v.length <= 16 &&
  /[A-Za-z]/.test(v) &&
  /[0-9]/.test(v) &&
  /[^A-Za-z0-9]/.test(v);

/** 영문자+숫자 포함 8~16자 (비밀번호 재설정용) */
export const isPwValidLoose = (v: string): boolean =>
  v.length >= 8 && v.length <= 16 && /[A-Za-z]/.test(v) && /[0-9]/.test(v);

/** 한글 2~5자 이름 */
export const isNameValid = (v: string): boolean => /^[가-힣]{2,5}$/.test(v);
