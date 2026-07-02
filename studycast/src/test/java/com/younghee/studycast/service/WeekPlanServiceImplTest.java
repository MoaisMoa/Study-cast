package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.younghee.studycast.dao.WeekPlanMapper;
import com.younghee.studycast.dto.WeekPlanDTO;
import com.younghee.studycast.dto.request.WeekPlanRequest;
import com.younghee.studycast.dto.response.WeekPlanResponse;

/**
 * WeekPlanServiceImpl 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * getWeekPlans()  : 사용자의 주간 계획 전체 조회
 * createWeekPlan(): 주간 계획 등록
 * updateWeekPlan(): 주간 계획 수정 (본인 소유 검증 포함)
 * deleteWeekPlan(): 주간 계획 삭제 (본인 소유 검증 포함)
 *
 * ── 소유권 검증 패턴 ───────────────────────────────────────────────────────────
 * update / delete 는 WHERE planNo=? AND userUuid=? 조건으로 DB 업데이트를 실행한다.
 * 영향받은 행(row)이 0 이면 → "해당 계획 없음 or 타인 소유" 로 판단해 IllegalArgumentException.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WeekPlanServiceImpl — 주간 계획 서비스 단위 테스트")
class WeekPlanServiceImplTest {

    @Mock private WeekPlanMapper weekPlanMapper;

    @InjectMocks
    private WeekPlanServiceImpl weekPlanService;

    private static final UUID USER_UUID = UUID.randomUUID();

    // ────────────────────────────────────────────────────────────────────────
    // 1. getWeekPlans() — 주간 계획 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getWeekPlans — 정상: DTO 목록을 WeekPlanResponse 목록으로 변환")
    void getWeekPlans_success() {
        // given: DB에서 2개 DTO 반환
        WeekPlanDTO dto1 = makePlanDTO(1L, 0, "Spring 공부", "09:00", "11:00");
        WeekPlanDTO dto2 = makePlanDTO(2L, 3, "알고리즘", "14:00", "16:00");
        given(weekPlanMapper.findAllByUser(USER_UUID)).willReturn(List.of(dto1, dto2));

        // when
        List<WeekPlanResponse> result = weekPlanService.getWeekPlans(USER_UUID);

        // then: 2개 반환, 첫 번째 항목 전체 필드 확인
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPlanNo()).isEqualTo(1L);
        assertThat(result.get(0).getDayOfWeek()).isEqualTo(0);
        assertThat(result.get(0).getTitle()).isEqualTo("Spring 공부");
        assertThat(result.get(0).getColor()).isEqualTo("blue");
        assertThat(result.get(0).getStartTime()).isEqualTo("09:00");
        assertThat(result.get(0).getEndTime()).isEqualTo("11:00");
    }

    @Test
    @DisplayName("getWeekPlans — 기록 없음: 빈 목록 반환")
    void getWeekPlans_empty() {
        given(weekPlanMapper.findAllByUser(USER_UUID)).willReturn(List.of());

        assertThat(weekPlanService.getWeekPlans(USER_UUID)).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. createWeekPlan() — 주간 계획 등록
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createWeekPlan — 정상: 매퍼 insert 메서드 호출 확인")
    void createWeekPlan_callsInsert() {
        // given
        WeekPlanRequest req = makePlanRequest(1, "자료구조", "blue", "10:00", "12:00");

        // when
        weekPlanService.createWeekPlan(USER_UUID, req);

        // then: insert 가 호출됐는지 확인
        verify(weekPlanMapper).insert(
                eq(USER_UUID), eq(1), eq("자료구조"), eq("blue"), eq("10:00"), eq("12:00"));
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. updateWeekPlan() — 주간 계획 수정
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateWeekPlan — 정상: 1행 처리되면 예외 없이 완료")
    void updateWeekPlan_success() {
        // given: DB에서 1행 업데이트 성공
        WeekPlanRequest req = makePlanRequest(2, "OS 공부", "red", "13:00", "15:00");
        given(weekPlanMapper.update(eq(10L), eq(USER_UUID), any(int.class), any(), any(), any(), any()))
                .willReturn(1);

        // when: 예외 없이 완료되면 성공
        weekPlanService.updateWeekPlan(USER_UUID, 10L, req);
    }

    @Test
    @DisplayName("updateWeekPlan — 실패: 업데이트 0행 (없거나 타인 소유) → IllegalArgumentException")
    void updateWeekPlan_notFound_throwsIllegalArgument() {
        WeekPlanRequest req = makePlanRequest(0, "없는 계획", "green", "08:00", "09:00");
        given(weekPlanMapper.update(eq(99L), eq(USER_UUID), any(int.class), any(), any(), any(), any()))
                .willReturn(0);

        assertThatThrownBy(() -> weekPlanService.updateWeekPlan(USER_UUID, 99L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("계획을 찾을 수 없습니다");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. deleteWeekPlan() — 주간 계획 삭제
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteWeekPlan — 정상: 1행 삭제되면 예외 없이 완료")
    void deleteWeekPlan_success() {
        // given: DB에서 1행 삭제 성공
        given(weekPlanMapper.deleteByIdAndUser(5L, USER_UUID)).willReturn(1);

        // when: 예외 없이 완료되면 성공
        weekPlanService.deleteWeekPlan(USER_UUID, 5L);

        verify(weekPlanMapper).deleteByIdAndUser(5L, USER_UUID);
    }

    @Test
    @DisplayName("deleteWeekPlan — 실패: 삭제 0행 (없거나 타인 소유) → IllegalArgumentException")
    void deleteWeekPlan_notFound_throwsIllegalArgument() {
        // given: 해당 planNo가 이 유저 소유가 아님 → 0행 삭제
        given(weekPlanMapper.deleteByIdAndUser(99L, USER_UUID)).willReturn(0);

        assertThatThrownBy(() -> weekPlanService.deleteWeekPlan(USER_UUID, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("계획을 찾을 수 없습니다");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    private WeekPlanDTO makePlanDTO(Long planNo, int dayOfWeek, String title,
                                    String startTime, String endTime) {
        WeekPlanDTO dto = new WeekPlanDTO();
        dto.setPlanNo(planNo);
        dto.setUserUuid(USER_UUID);
        dto.setDayOfWeek(dayOfWeek);
        dto.setTitle(title);
        dto.setColor("blue");
        dto.setStartTime(startTime);
        dto.setEndTime(endTime);
        return dto;
    }

    /** WeekPlanRequest 는 setter 가 없으므로 ReflectionTestUtils 로 필드 직접 주입 */
    private WeekPlanRequest makePlanRequest(int dayOfWeek, String title, String color,
                                             String startTime, String endTime) {
        WeekPlanRequest req = new WeekPlanRequest();
        ReflectionTestUtils.setField(req, "dayOfWeek", dayOfWeek);
        ReflectionTestUtils.setField(req, "title", title);
        ReflectionTestUtils.setField(req, "color", color);
        ReflectionTestUtils.setField(req, "startTime", startTime);
        ReflectionTestUtils.setField(req, "endTime", endTime);
        return req;
    }
}
