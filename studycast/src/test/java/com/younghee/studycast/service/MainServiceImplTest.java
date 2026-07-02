package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.younghee.studycast.dao.MainMapper;
import com.younghee.studycast.dto.request.MainRoomSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;
import com.younghee.studycast.dto.response.MainSummaryResponse;

/**
 * MainServiceImpl 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * getPublicRooms()        : 메인 페이지 공개 스터디 목록 조회 (페이지네이션)
 * getMyStudies()          : 내 스터디 최대 3개 조회 (로그인 필요)
 * getRecommendedRooms()   : 추천 스터디 조회 (로그인 필요)
 * getMainSummary()        : 개인 학습 요약 조회 (로그인 필요)
 * getGuestRecommendedRooms(): 비로그인 추천 스터디
 * getMyCreatedRooms()     : 내가 만든 스터디 전체 (로그인 필요)
 *
 * ── normalizeSearchRequest() — 요청 파라미터 정규화 핵심 로직 ─────────────────────
 * · tab/roomType/visibility → 대소문자 무관, null/blank → "ALL" 기본값
 * · 허용 범위 외 값 → IllegalArgumentException
 * · page < 0, size <= 0 → IllegalArgumentException
 * · size > 20 → 상한 20으로 조정
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("MainServiceImpl — 메인 서비스 단위 테스트")
class MainServiceImplTest {

    @Mock private MainMapper mainMapper;

    @InjectMocks
    private MainServiceImpl mainService;

    private static final UUID USER_UUID = UUID.randomUUID();

    // ────────────────────────────────────────────────────────────────────────
    // 1. getPublicRooms() — 정규화 + 페이지네이션
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getPublicRooms — 검색 파라미터 정규화 및 검증")
    class GetPublicRooms {

        @Test
        @DisplayName("null request → 모든 기본값(tab=ALL, size=10, page=0) 적용됨")
        void getPublicRooms_nullRequest_usesDefaults() {
            // null request → 내부에서 기본값으로 정규화됨
            given(mainMapper.findPublicRooms(any(), anyInt(), anyInt())).willReturn(List.of());

            MainRoomPageResponse resp = mainService.getPublicRooms(null);

            assertThat(resp.getPage()).isEqualTo(0);
            assertThat(resp.getSize()).isEqualTo(10);
        }

        @Test
        @DisplayName("tab이 소문자 'new'이면 대문자 'NEW'로 정규화되어 정상 처리")
        void getPublicRooms_lowercaseTab_normalizedToUppercase() {
            // "new" → "NEW" 는 허용 목록(ALLOWED_TABS)에 있으므로 예외 없음
            given(mainMapper.findPublicRooms(any(), anyInt(), anyInt())).willReturn(List.of());

            MainRoomSearchRequest req = makeRequest("new", null, null, 0, 10);

            // 예외 없이 완료되면 정상 처리
            mainService.getPublicRooms(req);
        }

        @Test
        @DisplayName("지원하지 않는 tab('POPULAR') → IllegalArgumentException")
        void getPublicRooms_invalidTab_throwsIllegalArgument() {
            MainRoomSearchRequest req = makeRequest("POPULAR", null, null, 0, 10);

            assertThatThrownBy(() -> mainService.getPublicRooms(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("잘못된 탭 값");
        }

        @Test
        @DisplayName("지원하지 않는 roomType('VIP') → IllegalArgumentException")
        void getPublicRooms_invalidRoomType_throwsIllegalArgument() {
            MainRoomSearchRequest req = makeRequest("ALL", "VIP", null, 0, 10);

            assertThatThrownBy(() -> mainService.getPublicRooms(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("잘못된 스터디 유형");
        }

        @Test
        @DisplayName("지원하지 않는 visibility('HIDDEN') → IllegalArgumentException")
        void getPublicRooms_invalidVisibility_throwsIllegalArgument() {
            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "HIDDEN", 0, 10);

            assertThatThrownBy(() -> mainService.getPublicRooms(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("잘못된 공개 여부");
        }

        @Test
        @DisplayName("page < 0 → IllegalArgumentException")
        void getPublicRooms_negativePage_throwsIllegalArgument() {
            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "ALL", -1, 10);

            assertThatThrownBy(() -> mainService.getPublicRooms(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("페이지 번호");
        }

        @Test
        @DisplayName("size <= 0 → IllegalArgumentException")
        void getPublicRooms_zeroSize_throwsIllegalArgument() {
            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "ALL", 0, 0);

            assertThatThrownBy(() -> mainService.getPublicRooms(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("페이지 크기");
        }

        @Test
        @DisplayName("size > MAX_SIZE(20) → 20으로 상한 처리")
        void getPublicRooms_oversizedRequest_cappedAt20() {
            given(mainMapper.findPublicRooms(any(), anyInt(), anyInt())).willReturn(List.of());

            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "ALL", 0, 999);
            MainRoomPageResponse resp = mainService.getPublicRooms(req);

            assertThat(resp.getSize()).isEqualTo(20);
            // 상한 처리 후 limit=21(size+1), offset=0 으로 쿼리됐는지 확인
            verify(mainMapper).findPublicRooms(any(), eq(21), eq(0));
        }

        @Test
        @DisplayName("DB가 size+1 개 반환 → last=false, 목록은 size 개로 잘림")
        void getPublicRooms_hasNextPage_lastFalse() {
            // size=2, limit=3 → 3개 반환 → 다음 페이지 있음
            List<MainRoomResponse> dbResult = List.of(
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class)
            );
            given(mainMapper.findPublicRooms(any(), anyInt(), anyInt())).willReturn(dbResult);

            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "ALL", 0, 2);
            MainRoomPageResponse resp = mainService.getPublicRooms(req);

            assertThat(resp.getLast()).isFalse();
            assertThat(resp.getRooms()).hasSize(2);
        }

        @Test
        @DisplayName("DB가 size 개 이하 반환 → last=true (마지막 페이지)")
        void getPublicRooms_lastPage_lastTrue() {
            // size=10, DB가 2개만 반환 → 마지막 페이지
            given(mainMapper.findPublicRooms(any(), anyInt(), anyInt()))
                    .willReturn(List.of(mock(MainRoomResponse.class), mock(MainRoomResponse.class)));

            MainRoomSearchRequest req = makeRequest("ALL", "ALL", "ALL", 0, 10);
            MainRoomPageResponse resp = mainService.getPublicRooms(req);

            assertThat(resp.getLast()).isTrue();
            assertThat(resp.getRooms()).hasSize(2);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. 로그인 필요 메서드 — null UUID 검증
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("로그인 필요 메서드 — null UUID → IllegalArgumentException")
    class LoginRequired {

        @Test
        @DisplayName("getMyStudies: null UUID → IllegalArgumentException")
        void getMyStudies_nullUuid_throwsIllegalArgument() {
            assertThatThrownBy(() -> mainService.getMyStudies(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("인증 사용자");
        }

        @Test
        @DisplayName("getMyStudies: 정상 — 매퍼 결과 그대로 반환")
        void getMyStudies_success() {
            List<MainRoomResponse> expected = List.of(mock(MainRoomResponse.class));
            given(mainMapper.findMyStudies(USER_UUID)).willReturn(expected);

            List<MainRoomResponse> result = mainService.getMyStudies(USER_UUID);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("getRecommendedRooms: null UUID → IllegalArgumentException")
        void getRecommendedRooms_nullUuid_throwsIllegalArgument() {
            assertThatThrownBy(() -> mainService.getRecommendedRooms(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("getMyCreatedRooms: null UUID → IllegalArgumentException")
        void getMyCreatedRooms_nullUuid_throwsIllegalArgument() {
            assertThatThrownBy(() -> mainService.getMyCreatedRooms(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. getMainSummary() — 개인 학습 요약 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMainSummary — 실패: null UUID → IllegalArgumentException")
    void getMainSummary_nullUuid_throwsIllegalArgument() {
        assertThatThrownBy(() -> mainService.getMainSummary(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("getMainSummary — 정상: 매퍼 결과를 그대로 반환")
    void getMainSummary_success_returnsMapperResult() {
        MainSummaryResponse expected = mock(MainSummaryResponse.class);
        given(mainMapper.findMainSummary(USER_UUID)).willReturn(expected);

        MainSummaryResponse result = mainService.getMainSummary(USER_UUID);

        assertThat(result).isSameAs(expected);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. getGuestRecommendedRooms() — 비로그인 추천 스터디 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getGuestRecommendedRooms — 정상: 결과 목록 반환 (인증 없이 호출 가능)")
    void getGuestRecommendedRooms_success_returnsList() {
        List<MainRoomResponse> expected = List.of(mock(MainRoomResponse.class));
        given(mainMapper.findGuestRecommendedRooms()).willReturn(expected);

        List<MainRoomResponse> result = mainService.getGuestRecommendedRooms();

        assertThat(result).hasSize(1).isSameAs(expected);
    }

    @Test
    @DisplayName("getGuestRecommendedRooms — 정상: 추천방이 없어도 빈 목록 반환 (예외 없음)")
    void getGuestRecommendedRooms_empty_returnsEmptyList() {
        given(mainMapper.findGuestRecommendedRooms()).willReturn(List.of());

        List<MainRoomResponse> result = mainService.getGuestRecommendedRooms();

        assertThat(result).isEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    private MainRoomSearchRequest makeRequest(String tab, String roomType, String visibility,
                                              int page, int size) {
        MainRoomSearchRequest req = new MainRoomSearchRequest();
        req.setTab(tab);
        req.setRoomType(roomType);
        req.setVisibility(visibility);
        req.setPage(page);
        req.setSize(size);
        return req;
    }
}
