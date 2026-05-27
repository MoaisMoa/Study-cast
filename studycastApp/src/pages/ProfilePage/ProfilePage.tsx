import { useEffect, useState } from "react";
import type {
  ProfileCategory,
  ProfileDraft,
  ProfileReadOnly,
} from "@/types/profile";
import { useT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { INITIAL_PROFILE, MAX_CATEGORIES, PROFILE_READONLY } from "@/data/profile";
import { fetchProfile, updateProfile } from "@/services/profileService";
import { AvatarSection } from "./sections/AvatarSection";
import { GenderSelector } from "./sections/GenderSelector";
import { BirthdayPicker } from "./sections/BirthdayPicker";
import type { BirthField } from "./sections/BirthdayPicker";
import { MottoField } from "./sections/MottoField";
import { CategoryPicker } from "./sections/CategoryPicker";
import { PasswordChangeModal } from "./sections/PasswordChangeModal";
import { WithdrawModal } from "./sections/WithdrawModal";

interface ProfileErrors {
  birth?: string;
  motto?: string;
}

export default function ProfilePage() {
  const T = useT();
  const isMobile = useIsMobile();
  const ff = "'Noto Sans KR', sans-serif";

  // 읽기 전용 (회원가입 등록 정보)
  const [readonly, setReadonly] = useState<ProfileReadOnly>(PROFILE_READONLY);

  // 저장된 상태(서버 기준값) + 편집 중인 draft 상태
  const [saved, setSaved] = useState<ProfileDraft>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<ProfileDraft>(INITIAL_PROFILE);

  const [errors, setErrors] = useState<ProfileErrors>({});

  // 저장 토스트 / 로딩 / API 에러
  const [savedOk, setSavedOk] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveApiError, setSaveApiError] = useState("");

  // 비밀번호 변경 모달 + 성공 토스트
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSavedOk, setPwSavedOk] = useState(false);

  // 회원 탈퇴 모달
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // 초기 데이터 로드 (mock)
  useEffect(() => {
    let alive = true;
    fetchProfile().then((res) => {
      if (!alive) return;
      setReadonly(res.readonly);
      setSaved(res.draft);
      setDraft(res.draft);
    });
    return () => {
      alive = false;
    };
  }, []);

  // dirty: 저장된 값과 draft가 다른지
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function updateDraft<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const n = { ...p };
      if (key === "birthY" || key === "birthM" || key === "birthD") delete n.birth;
      else if (key === "motto") delete n.motto;
      return n;
    });
  }

  function handleBirthChange(key: BirthField, value: string) {
    updateDraft(key, value);
  }

  function toggleCat(c: ProfileCategory) {
    const next = draft.categories.includes(c)
      ? draft.categories.filter((x) => x !== c)
      : draft.categories.length >= MAX_CATEGORIES
      ? draft.categories
      : [...draft.categories, c];
    updateDraft("categories", next);
  }

  /** 향후 실제 검증 규칙이 들어갈 자리 — 현재는 빈 객체 반환 (원본 동작 유지) */
  function validate(_d: ProfileDraft): ProfileErrors {
    return {};
  }

  async function handleSave() {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaveLoading(true);
    setSaveApiError("");
    try {
      const result = await updateProfile(draft);
      if (!result.ok) {
        setSaveApiError(result.message ?? "프로필 저장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      setSaved({ ...draft });
      setErrors({});
      setSavedOk(true);
      window.setTimeout(() => setSavedOk(false), 2500);
    } catch {
      setSaveApiError("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  }

  const saveBtnLabel = saveLoading
    ? "저장 중..."
    : pwSavedOk
    ? "✓ 비밀번호가 변경되었습니다."
    : savedOk
    ? "✓ 저장되었습니다"
    : "프로필 설정 완료";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: ff,
        color: T.text,
        transition: "background 0.25s",
      }}
    >
      {isMobile ? <MobileHeader /> : <Header />}

      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: isMobile ? "32px 20px 60px" : "48px 20px 80px",
        }}
      >
        <AvatarSection
          name={readonly.name}
          email={readonly.email}
          avatarUrl={draft.avatarUrl}
          onAvatarChange={(v) => updateDraft("avatarUrl", v)}
          onChangePasswordClick={() => setPwOpen(true)}
          isMobile={isMobile}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 이름 — 읽기 전용 */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.text,
                marginBottom: 8,
              }}
            >
              이름
            </div>
            <div
              style={{
                height: 48,
                padding: "0 14px",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 15,
                background: T.bg,
                color: T.text,
                display: "flex",
                alignItems: "center",
              }}
            >
              {readonly.name}
            </div>
          </div>

          {/* 성별 */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.text,
                marginBottom: 8,
              }}
            >
              성별
            </div>
            <GenderSelector
              value={draft.gender}
              onChange={(g) => updateDraft("gender", g)}
            />
          </div>

          {/* 생년월일 */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: T.text,
                marginBottom: 8,
              }}
            >
              생년월일
            </div>
            <BirthdayPicker
              birthY={draft.birthY}
              birthM={draft.birthM}
              birthD={draft.birthD}
              onChange={handleBirthChange}
              error={errors.birth}
            />
          </div>

          {/* 내 각오 */}
          <div>
            <MottoField
              value={draft.motto}
              onChange={(v) => updateDraft("motto", v)}
              error={errors.motto}
            />
          </div>

          {/* 관심 카테고리 */}
          <div>
            <CategoryPicker selected={draft.categories} onToggle={toggleCat} />
          </div>
        </div>

        {/* 저장 버튼 */}
        {saveApiError && (
          <div
            style={{
              fontSize: 13,
              color: T.red,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            {saveApiError}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!isDirty || saveLoading}
          style={{
            width: "100%",
            height: 52,
            marginTop: saveApiError ? 10 : 40,
            background: isDirty && !saveLoading ? T.red : T.border,
            color: isDirty && !saveLoading ? "#fff" : T.text2,
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: isDirty && !saveLoading ? "pointer" : "not-allowed",
            opacity: saveLoading ? 0.7 : 1,
            fontFamily: ff,
            transition: "opacity 0.15s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (isDirty && !saveLoading) e.currentTarget.style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = saveLoading ? "0.7" : "1";
          }}
        >
          {saveBtnLabel}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => setWithdrawOpen(true)}
            style={{
              background: "none",
              border: "none",
              fontSize: 14,
              color: T.text3,
              cursor: "pointer",
              fontFamily: ff,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.red)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.text3)}
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      <PasswordChangeModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onSuccess={() => {
          setPwOpen(false);
          setPwSavedOk(true);
          window.setTimeout(() => setPwSavedOk(false), 2500);
        }}
      />

      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}
