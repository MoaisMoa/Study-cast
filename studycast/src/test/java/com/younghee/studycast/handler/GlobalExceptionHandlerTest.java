package com.younghee.studycast.handler;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.NoSuchElementException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.younghee.studycast.exception.ForbiddenException;

/**
 * GlobalExceptionHandler 단위 테스트
 *
 * ── 이 테스트의 특징 ───────────────────────────────────────────────────────────
 * GlobalExceptionHandler는 의존하는 외부 객체(DB, JWT 등)가 없다.
 * 그래서 Mockito(@ExtendWith, @Mock)가 필요 없고,
 * 핸들러 인스턴스를 직접 new 로 만들어서 메서드를 호출하면 된다.
 *
 * ── 무엇을 검증하나? ──────────────────────────────────────────────────────────
 * GlobalExceptionHandler 는 각 예외 타입을 받아
 * "적절한 HTTP 상태 코드 + {success:false, message:...} 응답 바디"를 반환한다.
 * 테스트는 이 매핑이 정확한지를 확인한다.
 *
 * ── HTTP 상태 코드 요약 ────────────────────────────────────────────────────────
 * 400 Bad Request     : 요청값이 잘못됨 (IllegalArgumentException)
 * 401 Unauthorized    : 인증 실패 (SecurityException)
 * 403 Forbidden       : 인증은 됐지만 권한 없음 (ForbiddenException)
 * 404 Not Found       : 조회 대상 없음 (NoSuchElementException)
 * 409 Conflict        : 현재 상태에서 처리 불가 / DB 제약 충돌 (IllegalStateException, DataIntegrityViolationException)
 * 500 Internal Server : 예상치 못한 서버 오류 (RuntimeException, Exception)
 * ──────────────────────────────────────────────────────────────────────────────
 */
@DisplayName("GlobalExceptionHandler — 예외별 HTTP 응답 매핑 단위 테스트")
class GlobalExceptionHandlerTest {

    // 의존성이 없으므로 Mockito 없이 직접 인스턴스 생성
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // ── 응답 바디 검증 헬퍼 ─────────────────────────────────────────────────
    /**
     * ResponseEntity의 body를 Map으로 꺼내 검증하는 헬퍼.
     * handler 메서드는 Map.of(...) 형태로 반환하므로 Map으로 캐스팅해서 쓴다.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> body(ResponseEntity<?> response) {
        return (Map<String, Object>) response.getBody();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. 400 Bad Request — IllegalArgumentException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("IllegalArgumentException → 400 Bad Request + success:false")
    void illegalArgument_returns400() {
        // given: 잘못된 요청값 예외
        IllegalArgumentException ex = new IllegalArgumentException("이메일을 입력하세요.");

        // when: 핸들러 메서드를 직접 호출
        ResponseEntity<Map<String, Object>> response = handler.handleIllegalArgumentException(ex);

        // then: 상태 코드 400, 본문에 메시지가 담겨있어야 함
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("이메일을 입력하세요.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. 409 Conflict — IllegalStateException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("IllegalStateException → 409 Conflict + success:false")
    void illegalState_returns409() {
        // given: 현재 상태에서 처리 불가한 예외 (예: 정원 가득)
        IllegalStateException ex = new IllegalStateException("스터디방 정원이 가득 찼습니다.");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleIllegalStateException(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("스터디방 정원이 가득 찼습니다.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. 404 Not Found — NoSuchElementException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("NoSuchElementException → 404 Not Found + success:false")
    void noSuchElement_returns404() {
        // given: 존재하지 않는 리소스 예외
        NoSuchElementException ex = new NoSuchElementException("존재하지 않는 스터디방입니다.");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleNoSuchElementException(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("존재하지 않는 스터디방입니다.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. 401 Unauthorized — SecurityException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("SecurityException → 401 Unauthorized + success:false")
    void securityException_returns401() {
        // given: 인증 실패 예외
        SecurityException ex = new SecurityException("이메일 또는 비밀번호가 올바르지 않습니다.");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleSecurityException(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. 403 Forbidden — ForbiddenException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ForbiddenException → 403 Forbidden + success:false")
    void forbiddenException_returns403() {
        // given: 인증은 됐지만 권한이 없는 예외 (예: 방장만 가능한 기능을 일반 멤버가 시도)
        ForbiddenException ex = new ForbiddenException("방장만 삭제할 수 있습니다.");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleForbiddenException(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("방장만 삭제할 수 있습니다.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. 500 Internal Server Error — RuntimeException
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("RuntimeException → 500 Internal Server Error, 메시지는 고정 문구")
    void runtimeException_returns500_withGenericMessage() {
        // given: 예상치 못한 런타임 예외 (실제 메시지는 외부에 노출하지 않음)
        RuntimeException ex = new RuntimeException("DB 연결 실패 (내부 상세)");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleRuntimeException(ex);

        // then: 상태 500, 실제 예외 메시지 대신 고정 문구로 응답
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(body(response).get("success")).isEqualTo(false);
        assertThat(body(response).get("message")).isEqualTo("서버 오류가 발생했습니다.");
    }

    @Test
    @DisplayName("Exception → 500 Internal Server Error, 메시지는 고정 문구")
    void exception_returns500_withGenericMessage() throws Exception {
        // given: 체크 예외 포함 모든 예외
        Exception ex = new Exception("예상 못한 오류");

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleException(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(body(response).get("message")).isEqualTo("서버 오류가 발생했습니다.");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. 409 / 400 — DataIntegrityViolationException (DB 제약 위반)
    //
    // DataIntegrityViolationException 은 DB 제약 조건 위반 시 Spring이 던지는 예외.
    // 내부 cause 메시지를 읽어 어떤 제약이 위반됐는지 파악한 뒤 적절한 응답을 반환한다.
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DataIntegrityViolation — 참여 코드 중복(uq_rooms_private_password) → 409 + 코드 중복 메시지")
    void dataIntegrityViolation_joinCodeDuplicate_returns409() {
        // given: DB 유니크 제약(uq_rooms_private_password) 위반 예외
        // DataIntegrityViolationException(메시지, cause) 형태로 생성하면
        // getMostSpecificCause()가 cause를 반환하고 cause.getMessage()로 제약명을 확인
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "constraint violation",
                new RuntimeException("duplicate key value violates unique constraint \"uq_rooms_private_password\"")
        );

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrityViolation(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(body(response).get("message")).isEqualTo("이미 사용 중인 참여 코드입니다.");
    }

    @Test
    @DisplayName("DataIntegrityViolation — 카테고리 FK 위반(fk_rooms_category) → 400 + 카테고리 없음 메시지")
    void dataIntegrityViolation_categoryFk_returns400() {
        // given: 존재하지 않는 카테고리를 참조하는 FK 제약 위반
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "constraint violation",
                new RuntimeException("insert or update on table \"rooms\" violates foreign key constraint \"fk_rooms_category\"")
        );

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrityViolation(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).get("message")).isEqualTo("존재하지 않는 카테고리입니다.");
    }

    @Test
    @DisplayName("DataIntegrityViolation — 그 외 DB 제약 위반 → 409 + 일반 오류 메시지")
    void dataIntegrityViolation_other_returns409() {
        // given: 특별히 처리하지 않는 기타 제약 위반
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "constraint violation",
                new RuntimeException("some_other_constraint")
        );

        // when
        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrityViolation(ex);

        // then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(body(response).get("message")).isEqualTo("데이터 저장 중 제약조건 오류가 발생했습니다.");
    }
}
