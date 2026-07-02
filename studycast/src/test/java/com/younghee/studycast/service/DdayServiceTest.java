package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.younghee.studycast.dao.DdayMapper;
import com.younghee.studycast.dto.DdaysDTO;
import com.younghee.studycast.dto.request.DdayCreateRequest;

/**
 * DdayService 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * createDday() : D-day 등록
 *                - type 이 null 이거나 blank 이면 "기타" 로 기본값 처리
 *                - targetDate 는 "yyyy-MM-dd" 문자열을 LocalDate 로 파싱
 * deleteDday() : D-day 삭제 (본인 소유 검증 포함)
 *                - 삭제된 행 0 이면 → IllegalArgumentException
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DdayService — D-day 서비스 단위 테스트")
class DdayServiceTest {

    @Mock private DdayMapper ddayMapper;

    @InjectMocks
    private DdayService ddayService;

    private static final UUID USER_UUID = UUID.randomUUID();

    // ────────────────────────────────────────────────────────────────────────
    // 1. getDdays() — D-day 목록 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getDdays — 정상: 등록된 D-day 목록을 DdayResponse 로 변환하여 반환")
    void getDdays_success_returnsMappedList() {
        // given: 매퍼가 DdaysDTO 2개를 반환
        DdaysDTO dto1 = new DdaysDTO();
        dto1.setDdayNo(1L);
        dto1.setDdayTitle("수능");
        dto1.setDdayType("시험");
        dto1.setTargetDate(LocalDate.of(2025, 11, 13));

        DdaysDTO dto2 = new DdaysDTO();
        dto2.setDdayNo(2L);
        dto2.setDdayTitle("졸업식");
        dto2.setDdayType("기타");
        dto2.setTargetDate(LocalDate.of(2026, 2, 20));

        given(ddayMapper.findAllByUser(USER_UUID)).willReturn(List.of(dto1, dto2));

        // when
        var result = ddayService.getDdays(USER_UUID);

        // then: 2개 반환, 첫 번째 항목 필드 매핑 정확성 확인
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getDdayNo()).isEqualTo(1L);
        assertThat(result.get(0).getTitle()).isEqualTo("수능");
        assertThat(result.get(0).getType()).isEqualTo("시험");
        assertThat(result.get(0).getTargetDate()).isEqualTo("2025-11-13");
    }

    @Test
    @DisplayName("getDdays — 정상: D-day가 없으면 빈 목록 반환 (예외 없음)")
    void getDdays_empty_returnsEmptyList() {
        given(ddayMapper.findAllByUser(USER_UUID)).willReturn(List.of());

        var result = ddayService.getDdays(USER_UUID);

        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. createDday() — D-day 등록
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createDday — 정상: 명시적 type 이 있으면 그대로 사용")
    void createDday_explicitType_usedAsGiven() {
        // given
        DdayCreateRequest req = makeRequest("수능", "시험", "2025-11-13");

        // when
        ddayService.createDday(USER_UUID, req);

        // then: "시험" 타입이 그대로 매퍼에 전달됐어야 함
        verify(ddayMapper).insert(
                eq(USER_UUID),
                eq("수능"),
                eq("시험"),
                eq(LocalDate.of(2025, 11, 13))
        );
    }

    @Test
    @DisplayName("createDday — type이 null 이면 '기타' 로 기본값 처리")
    void createDday_nullType_defaultsToEtc() {
        // given: type 없이 등록
        DdayCreateRequest req = makeRequest("졸업식", null, "2026-02-20");

        // when
        ddayService.createDday(USER_UUID, req);

        // then: type 자리에 "기타" 가 전달됐어야 함
        verify(ddayMapper).insert(
                eq(USER_UUID),
                eq("졸업식"),
                eq("기타"),
                eq(LocalDate.of(2026, 2, 20))
        );
    }

    @Test
    @DisplayName("createDday — type이 공백 문자열이면 '기타' 로 기본값 처리")
    void createDday_blankType_defaultsToEtc() {
        DdayCreateRequest req = makeRequest("MT", "   ", "2025-08-01");

        ddayService.createDday(USER_UUID, req);

        verify(ddayMapper).insert(eq(USER_UUID), eq("MT"), eq("기타"), any(LocalDate.class));
    }

    @Test
    @DisplayName("createDday — 실패: targetDate 가 null이면 NullPointerException")
    void createDday_nullTargetDate_throwsNullPointer() {
        // LocalDate.parse(null) → NullPointerException
        DdayCreateRequest req = makeRequest("수능", "시험", null);

        assertThatThrownBy(() -> ddayService.createDday(USER_UUID, req))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("createDday — 실패: 날짜 형식이 잘못되면 DateTimeParseException")
    void createDday_invalidDateFormat_throwsDateTimeParseException() {
        // "20251113" 처럼 구분자 없는 형식 → DateTimeParseException
        DdayCreateRequest req = makeRequest("수능", "시험", "20251113");

        assertThatThrownBy(() -> ddayService.createDday(USER_UUID, req))
                .isInstanceOf(DateTimeParseException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. deleteDday() — D-day 삭제
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteDday — 정상: 1행 삭제되면 예외 없이 완료")
    void deleteDday_success() {
        // given: 소유자가 맞아서 1행 삭제
        given(ddayMapper.deleteByIdAndUser(1L, USER_UUID)).willReturn(1);

        // when: 예외 없으면 성공
        ddayService.deleteDday(USER_UUID, 1L);

        verify(ddayMapper).deleteByIdAndUser(1L, USER_UUID);
    }

    @Test
    @DisplayName("deleteDday — 실패: 삭제 0행 (없거나 타인 소유) → IllegalArgumentException")
    void deleteDday_notFound_throwsIllegalArgument() {
        // given: 해당 일정이 없거나 타인 소유 → 0행 삭제
        given(ddayMapper.deleteByIdAndUser(99L, USER_UUID)).willReturn(0);

        assertThatThrownBy(() -> ddayService.deleteDday(USER_UUID, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("해당 일정을 찾을 수 없습니다");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    /** DdayCreateRequest 는 setter 가 없으므로 ReflectionTestUtils 로 필드 직접 주입 */
    private DdayCreateRequest makeRequest(String title, String type, String targetDate) {
        DdayCreateRequest req = new DdayCreateRequest();
        ReflectionTestUtils.setField(req, "title", title);
        ReflectionTestUtils.setField(req, "type", type);
        ReflectionTestUtils.setField(req, "targetDate", targetDate);
        return req;
    }
}
