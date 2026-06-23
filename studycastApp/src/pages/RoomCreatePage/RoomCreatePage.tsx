/** 핵심! 기존의 "이미지 먼저 업로드 -> URL로 방 생성" 흐름 제거하고,
 * 방 정보와 이미지 파일 createRoom(payload, thumbnailFile)로 한 번에 보내기
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreateRoomPayload, RoomCategory, RoomVisibility } from "@/types";
import { useRT } from "@/theme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Row } from "@/components/ui/Row";
import { offsetDate, todayStr } from "@/utils/date";
import { createRoom } from "@/services/roomService";
import { canEnterRoom, setPendingEntry } from "@/utils/roomSession";
import { ThumbnailUploader } from "./sections/ThumbnailUploader";
import { VisibilitySelector } from "./sections/VisibilitySelector";
import { JoinCodeField } from "./sections/JoinCodeField";
import type { CodeCheckState } from "./sections/JoinCodeField";
import { CapacityStepper } from "./sections/CapacityStepper";
import { PeriodPicker } from "./sections/PeriodPicker";
import { DeviceToggles } from "./sections/DeviceToggles";
import { NoticeField } from "./sections/NoticeField";
import { CategoryPicker } from "./sections/CategoryPicker";
import { ResetConfirmModal } from "./sections/ResetConfirmModal";
import { SubmitConfirmModal } from "./sections/SubmitConfirmModal";
import { CreateSuccess } from "./sections/CreateSuccess";
import { ROOM_CATEGORY_NO } from "@/types";
import axios from "axios";

interface FormErrors {
  name?: string;
  visibility?: string;
  code?: string;
  count?: string;
  date?: string;
  category?: string;
  notice?: string;
}

export default function RoomCreatePage() {
  const T = useRT();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768); // 헤더/레이아웃 전환 기준 — 다른 페이지와 통일

  // ── 폼 상태 ──────────────────────────────────────
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  /** 업로드할 실제 파일 (서버 전송용) — 미리보기 thumbnail과 별도 보관 */
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<RoomVisibility>("public");
  const [code, setCode] = useState("");
  const [codeCheck, setCodeCheck] = useState<CodeCheckState>("idle");
  const [count, setCount] = useState<number | "">(2);
  const [startDate] = useState<string>(todayStr());
  const [endDate, setEndDate] = useState<string>(offsetDate(89));
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [notice, setNotice] = useState("");
  /** 관심 카테고리 — 메인 페이지 필터(CATS_FILTER)와 동일한 값 */
  const [selectedCats, setSelectedCats] = useState<RoomCategory[]>([]);

  // ── 모달/플로우 상태 ─────────────────────────────
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<number | null>(null);

  // ── 검증 ────────────────────────────────────────
  function validate(): FormErrors {
    const e: FormErrors = {};

    if (!name.trim()) e.name = "스터디 이름을 입력해주세요.";
    else if (name.trim().length < 2) e.name = "스터디 이름은 2자 이상 입력해주세요.";
    else if (name.trim().length > 10) e.name = "스터디 이름은 10자 이하로 입력해주세요.";

    if (!visibility) e.visibility = "공개 여부를 선택해주세요.";

    if (visibility === "private") {
      if (!code.trim()) e.code = "참여 코드를 입력해주세요.";
      else if (!/^\d{4,6}$/.test(code.trim())) e.code = "참여 코드는 숫자 4~6자리로 입력해주세요.";
      else if (codeCheck !== "ok") e.code = 
                                        codeCheck === "duplicate"
                                        ? "이미 사용 중인 참여 코드입니다."
                                        : "참여 코드 중복 확인을 완료해주세요.";
    }

    const countNum = typeof count === "number" ? count : NaN;
    const MAX_ROOM_USERS = 4;
    if (count === "" || isNaN(countNum)) e.count = "인원 수를 입력해주세요.";
    else if (countNum < 1) e.count = "최소 1명 이상 입력해주세요.";
    else if (countNum > MAX_ROOM_USERS) e.count = "최대 인원은 4명까지 입력 가능합니다.";

    if (!endDate) e.date = "종료일을 선택해주세요.";
    else if (endDate <= startDate) e.date = "종료일은 시작일 이후 날짜를 선택해주세요.";
    else {
      const diffDays = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
      ) + 1;
      if (diffDays > 90) e.date = "종료일은 시작일로부터 최대 90일 이내로 설정해주세요.";
    }
    /** 관심 카테고리 검증 */
    if (selectedCats.length !== 1) {
      e.category = "관심 카테고리를 1개 선택해주세요.";
    }
    /** 공지사항 검증 */
    if (notice.trim().length > 500) {
      e.notice = "공지사항은 500자 이하로 입력해주세요.";
    }

    return e;
  }

  // ── 핸들러 ──────────────────────────────────────
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setShowSubmitConfirm(true);
  };

  const handleConfirmCreate = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError("");
    
    try {
      const selectedCategory = selectedCats[0];

      if (!selectedCategory) {
        throw new Error("카테고리가 선택되지 않았습니다.");
      }

      const payload: CreateRoomPayload = {
        roomTitle: name.trim(),
        roomPrivate: visibility === "private",
        roomPassword:
          visibility === "private"
            ? code.trim()
            : null,
        maxUsers:
          typeof count === "number"
            ? count
            : 1,
        expiredAt: endDate,
        cameraStatus: camOn,
        micStatus: micOn,
        categoryNo: ROOM_CATEGORY_NO[selectedCategory],
        roomNotice: notice.trim() || null,
      };

      const response = await createRoom(
        payload,
        thumbnailFile
      );

      setCreatedRoomId(response.roomNo);
      setShowSubmitConfirm(false);
      setSubmitted(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setCreateError(
          error.response?.data?.message ??
            "스터디 그룹 방 생성 중 오류가 발생했습니다."
        );
      } else {
        setCreateError(
          "스터디 그룹 방 생성 중 오류가 발생했습니다."
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setCreatedRoomId(null);
    setThumbnail(null);
    setThumbnailFile(null);
    setName("");
    setCode("");
    setCodeCheck("idle");
    setVisibility("public");
    setCount(2);
    /** 오늘 + 90일 (시작일 포함) */
    setEndDate(offsetDate(89));
    setCamOn(true);
    setMicOn(false);
    setNotice("");
    setSelectedCats([]);
    setErrors({});
    setShowResetConfirm(false);
    setCreateError("");
  };

  const enterCreatedRoom = async () => {
    if (createdRoomId != null) {
      const allowed = await canEnterRoom();
      if (!allowed) {
        setCreateError("이미 입장 중인 방이 있습니다.");
        return;
      }
      setPendingEntry(String(createdRoomId));
      window.open(`${window.location.origin}/rooms/${createdRoomId}`, "_blank", "noopener,noreferrer");
    } else {
      navigate("/");
    }
  };

  // ── 스타일 ──────────────────────────────────────
  const page = {
    minHeight: "100vh",
    background: T.bg,
    fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',-apple-system,sans-serif",
    color: T.text,
    transition: "background 0.25s",
  } as const;
  const bodyPad = isMobile ? "0 16px 60px" : "0 32px 80px";
  const bodyMax = isMobile ? "100%" : 860;

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 14px",
    fontSize: 14,
    background: T.surface2,
    color: T.text,
    borderStyle: "solid" as const,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.15s",
  };
  const errStyle = { fontSize: 12, color: T.red, margin: "5px 0 0" } as const;
  const hintStyle = { fontSize: 12, color: T.muted, margin: "5px 0 0" } as const;

  // ── 성공 화면 ────────────────────────────────────
  if (submitted) {
    return (
      <div style={page}>
        {isMobile ? <MobileHeader /> : <Header />}
        <div style={{
          maxWidth: bodyMax,
          margin: "0 auto",
          padding: isMobile ? "24px 16px 60px" : "48px 32px 80px",
        }}>
          <CreateSuccess
            thumbnail={thumbnail}
            name={name}
            visibility={visibility}
            count={typeof count === "number" ? count : 1}
            startDate={startDate}
            endDate={endDate}
            camOn={camOn}
            micOn={micOn}
            notice={notice}
            roomId={createdRoomId ?? 0}
            categories={selectedCats.map(String)}
            isMobile={isMobile}
            onEnter={enterCreatedRoom}
          />
        </div>
      </div>
    );
  }

  // ── 폼 화면 ─────────────────────────────────────
  return (
    <div style={page}>
      {isMobile ? <MobileHeader /> : <Header />}

      <div style={{ background: T.bg, transition: "background 0.25s" }}>
        <div style={{
          maxWidth: bodyMax,
          margin: "0 auto",
          padding: isMobile ? "20px 16px 14px" : "28px 32px 20px",
        }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 20 : 26,
            fontWeight: 800,
            color: T.text,
            letterSpacing: "-0.02em",
          }}>
            스터디 방 만들기
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: bodyMax, margin: "0 auto", padding: bodyPad }}>
        {/* 대표 이미지 */}
        <Row label="대표 이미지" hint="4:3 비율 권장" isMobile={isMobile}>
          {isMobile ? (
            <ThumbnailUploader value={thumbnail} onChange={setThumbnail} onFileChange={setThumbnailFile} isMobile />
          ) : (
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <ThumbnailUploader value={thumbnail} onChange={setThumbnail} onFileChange={setThumbnailFile} isMobile={false} />
              <div style={{ flex: 1, paddingTop: 4 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
                  스터디 방을 대표하는 이미지를 업로드하세요.<br />
                  이미지가 없으면 기본 이미지가 사용됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()}
                  style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface3, color: T.text2, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}
                >
                  파일 선택
                </button>
              </div>
            </div>
          )}
        </Row>

        {/* 스터디 이름 */}
        <Row label="스터디 이름" required isMobile={isMobile}>
          <input
            type="text"
            placeholder="예: 토익 900점 목표반"
            maxLength={10}
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (val.length === 0) setErrors((p) => ({ ...p, name: "" }));
              else if (val.trim().length < 2)
                setErrors((p) => ({ ...p, name: "스터디 이름은 2자 이상 입력해주세요." }));
              else if (val.trim().length > 10)
                setErrors((p) => ({ ...p, name: "스터디 이름은 10자 이하로 입력해주세요." }));
              else setErrors((p) => ({ ...p, name: "" }));
            }}
            style={{ ...inputStyle, ...(errors.name ? { borderColor: T.red } : {}) }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            {errors.name ? <span style={errStyle}>{errors.name}</span> : <span />}
            <span style={{ ...hintStyle, marginTop: 0, color: name.length >= 10 ? T.red : undefined }}>
              {name.length} / 10
            </span>
          </div>
        </Row>

        {/* 공개 설정 */}
        <Row label="공개 설정" required hint="생성 후 변경 불가" isMobile={isMobile}>
          <VisibilitySelector
            value={visibility}
            onChange={(v) => {
              setVisibility(v);
              setErrors((p) => ({ ...p, visibility: "", code: "" }));

              if (v === "public") {
                setCode("");
                setCodeCheck("idle");
              }
            }}
            error={errors.visibility}
            isMobile={isMobile}
          />
        </Row>

        {/* 참여 코드 */}
        {visibility === "private" && (
          <Row label="참여 코드" required hint="숫자 4~6자리" isMobile={isMobile}>
            <JoinCodeField
              code={code}
              onChange={(v) => {
                setCode(v);

                if (v.length === 0) setErrors((p) => ({ ...p, code: "" }));
                else if (v.length < 4)
                  setErrors((p) => ({ ...p, code: "참여 코드는 4자리 이상 입력해주세요." }));
                else setErrors((p) => ({ ...p, code: "" }));
              }}
              state={codeCheck}
              setState={setCodeCheck}
              error={errors.code}
              onErrorClear={() => setErrors((p) => ({ ...p, code: "" }))}
              isMobile={isMobile}
            />
          </Row>
        )}

        {/* 최대 인원 */}
        <Row label="최대 인원" required hint="최소 1명 · 최대 4명" isMobile={isMobile}>
          <CapacityStepper
            count={count}
            onChange={setCount}
            error={errors.count}
            setError={(msg) => setErrors((p) => ({ ...p, count: msg }))}
          />
        </Row>

        {/* 기간 설정 */}
        <Row label="기간 설정" required isMobile={isMobile}>
          <PeriodPicker
            startDate={startDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            error={errors.date}
            setError={(msg) => setErrors((p) => ({ ...p, date: msg }))}
            isMobile={isMobile}
          />
        </Row>

        {/* 관심 카테고리 — 메인페이지 필터와 동일한 카테고리 값 사용 */}
        <Row label="관심 카테고리" required hint="1개 선택" isMobile={isMobile}>
          <CategoryPicker
            value={selectedCats}
            onChange={(categories) => {
              setSelectedCats(categories);
              setErrors((prev) => ({
                ...prev,
                category: "",
              }));
            }}
            isMobile={isMobile}
          />
          {errors.category && (
            <p style={errStyle}>{errors.category}</p>
          )}
        </Row>

        {/* 장치 설정 */}
        <Row label="장치 설정" hint="입장 시 기본 상태" isMobile={isMobile}>
          <DeviceToggles
            camOn={camOn}
            micOn={micOn}
            setCamOn={setCamOn}
            setMicOn={setMicOn}
            isMobile={isMobile}
          />
        </Row>

        {/* 공지사항 */}
        <Row label="공지사항" hint="선택 입력 · 최대 500자" isMobile={isMobile}>
          <NoticeField
            value={notice}
            onChange={setNotice}
            error={errors.notice}
            setError={(msg) => setErrors((p) => ({ ...p, notice: msg }))}
          />
        </Row>

        {/* 하단 버튼 */}
        <div style={{
          marginTop: 32,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "flex-end",
          gap: 10,
        }}>
          <ResetConfirmModal
            open={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleReset}
          />
          <SubmitConfirmModal
            open={showSubmitConfirm}
            onClose={() => setShowSubmitConfirm(false)}
            isCreating={isCreating}
            onConfirm={handleConfirmCreate}
            createError={createError}
            thumbnail={thumbnail}
            name={name}
            visibility={visibility}
            count={typeof count === "number" ? count : 1}
            startDate={startDate}
            endDate={endDate}
            camOn={camOn}
            micOn={micOn}
            categories={selectedCats}
          />
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              padding: "11px 28px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.muted,
              cursor: "pointer",
              order: isMobile ? 2 : 0,
              transition: "all 0.15s",
            }}
          >
            초기화
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "13px 32px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 8,
              border: "none",
              background: T.red,
              color: "#fff",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s",
              order: isMobile ? 1 : 0,
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            방송 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
