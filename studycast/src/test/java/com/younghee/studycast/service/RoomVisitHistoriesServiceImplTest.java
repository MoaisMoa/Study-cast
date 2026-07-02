package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.NoSuchElementException;
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

import com.younghee.studycast.dao.RoomVisitHistoriesMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.request.RoomVisitSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;

/**
 * RoomVisitHistoriesServiceImpl 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * recordVisit()             : 방 방문 기록 저장/갱신
 * getRecentVisitedRooms()   : 최근 방문한 방 목록 (페이지네이션)
 * getFrequentVisitedRooms() : 자주 방문한 방 목록 (페이지네이션)
 *
 * ── 페이지네이션 "size+1" 패턴 ─────────────────────────────────────────────────
 * DB에서 size+1 개를 가져온 뒤:
 *   - 실제로 size+1 개가 오면 → 다음 페이지 있음 (last=false), 목록은 size 개로 자름
 *   - size 개 이하면 → 마지막 페이지 (last=true)
 *
 * ── normalizeRequest() — 페이지 파라미터 정규화 ─────────────────────────────────
 *   null request → page=0, size=10 기본값
 *   page < 0    → IllegalArgumentException
 *   size <= 0   → IllegalArgumentException
 *   size > 20   → 20 으로 상한 처리
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RoomVisitHistoriesServiceImpl — 방문 기록 서비스 단위 테스트")
class RoomVisitHistoriesServiceImplTest {

    @Mock private RoomVisitHistoriesMapper roomVisitHistoriesMapper;
    @Mock private RoomsMapper              roomsMapper;

    @InjectMocks
    private RoomVisitHistoriesServiceImpl service;

    private static final UUID USER_UUID = UUID.randomUUID();

    // ────────────────────────────────────────────────────────────────────────
    // 1. recordVisit() — 방문 기록 저장
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("recordVisit — 방문 기록 저장")
    class RecordVisit {

        @Test
        @DisplayName("정상: 방이 존재하면 upsertVisitHistory 호출")
        void recordVisit_success() {
            // given: 방이 DB에 존재함
            RoomsDTO room = new RoomsDTO();
            room.setRoomNo(1L);
            given(roomsMapper.findByRoomNo(1L)).willReturn(room);

            // when
            service.recordVisit(1L, USER_UUID);

            // then: upsert 호출 확인
            verify(roomVisitHistoriesMapper).upsertVisitHistory(1L, USER_UUID);
        }

        @Test
        @DisplayName("실패: null roomNo → IllegalArgumentException")
        void recordVisit_nullRoomNo_throwsIllegalArgument() {
            assertThatThrownBy(() -> service.recordVisit(null, USER_UUID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("방 번호");
        }

        @Test
        @DisplayName("실패: roomNo <= 0 → IllegalArgumentException")
        void recordVisit_zeroRoomNo_throwsIllegalArgument() {
            assertThatThrownBy(() -> service.recordVisit(0L, USER_UUID))
                    .isInstanceOf(IllegalArgumentException.class);

            assertThatThrownBy(() -> service.recordVisit(-1L, USER_UUID))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("실패: null userUuid → SecurityException")
        void recordVisit_nullUserUuid_throwsSecurity() {
            assertThatThrownBy(() -> service.recordVisit(1L, null))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("인증 사용자");
        }

        @Test
        @DisplayName("실패: 존재하지 않는 방 → NoSuchElementException")
        void recordVisit_roomNotFound_throwsNoSuchElement() {
            // given: 방이 없음
            given(roomsMapper.findByRoomNo(999L)).willReturn(null);

            assertThatThrownBy(() -> service.recordVisit(999L, USER_UUID))
                    .isInstanceOf(NoSuchElementException.class)
                    .hasMessageContaining("존재하지 않는 스터디방");

            // upsert 는 호출되지 않아야 함
            verify(roomVisitHistoriesMapper, never()).upsertVisitHistory(any(), any());
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. getRecentVisitedRooms() — 페이지네이션 + 정규화
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getRecentVisitedRooms — 최근 방문 방 목록 페이지네이션")
    class GetRecentVisitedRooms {

        @Test
        @DisplayName("null request 전달 시 page=0, size=10 기본값 사용")
        void getRecentVisitedRooms_nullRequest_usesDefaults() {
            // null → page=0, size=10, limit=11, offset=0
            given(roomVisitHistoriesMapper.findRecentVisitedRooms(eq(USER_UUID), eq(11), eq(0)))
                    .willReturn(List.of());

            MainRoomPageResponse resp = service.getRecentVisitedRooms(USER_UUID, null);

            assertThat(resp.getPage()).isEqualTo(0);
            assertThat(resp.getSize()).isEqualTo(10);
        }

        @Test
        @DisplayName("page < 0 → IllegalArgumentException")
        void getRecentVisitedRooms_negativePage_throwsIllegalArgument() {
            RoomVisitSearchRequest req = makeRequest(-1, 10);

            assertThatThrownBy(() -> service.getRecentVisitedRooms(USER_UUID, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("페이지 번호");
        }

        @Test
        @DisplayName("size <= 0 → IllegalArgumentException")
        void getRecentVisitedRooms_zeroSize_throwsIllegalArgument() {
            RoomVisitSearchRequest req = makeRequest(0, 0);

            assertThatThrownBy(() -> service.getRecentVisitedRooms(USER_UUID, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("페이지 크기");
        }

        @Test
        @DisplayName("size > MAX_SIZE(20) → 20으로 상한 처리")
        void getRecentVisitedRooms_oversizedRequest_cappedAt20() {
            // size=100 요청 → 내부적으로 20으로 조정, limit=21, offset=0
            given(roomVisitHistoriesMapper.findRecentVisitedRooms(eq(USER_UUID), eq(21), eq(0)))
                    .willReturn(List.of());

            RoomVisitSearchRequest req = makeRequest(0, 100);
            MainRoomPageResponse resp = service.getRecentVisitedRooms(USER_UUID, req);

            assertThat(resp.getSize()).isEqualTo(20);
        }

        @Test
        @DisplayName("DB가 size+1 개 반환 → last=false, 목록은 size 개로 잘림")
        void getRecentVisitedRooms_hasNextPage_lastFalse() {
            // size=2, limit=3 → DB가 3개 반환 → 다음 페이지 있음
            List<MainRoomResponse> dbResult = List.of(
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class) // 이 1개가 "다음 페이지 있음" 신호
            );
            given(roomVisitHistoriesMapper.findRecentVisitedRooms(eq(USER_UUID), eq(3), eq(0)))
                    .willReturn(dbResult);

            RoomVisitSearchRequest req = makeRequest(0, 2);
            MainRoomPageResponse resp = service.getRecentVisitedRooms(USER_UUID, req);

            assertThat(resp.getLast()).isFalse();
            assertThat(resp.getRooms()).hasSize(2); // size 개로 잘려야 함
        }

        @Test
        @DisplayName("DB가 size 개 이하 반환 → last=true (마지막 페이지)")
        void getRecentVisitedRooms_lastPage_lastTrue() {
            // size=10, DB가 3개만 반환 → 마지막 페이지
            List<MainRoomResponse> dbResult = List.of(
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class),
                    mock(MainRoomResponse.class)
            );
            given(roomVisitHistoriesMapper.findRecentVisitedRooms(eq(USER_UUID), eq(11), eq(0)))
                    .willReturn(dbResult);

            RoomVisitSearchRequest req = makeRequest(0, 10);
            MainRoomPageResponse resp = service.getRecentVisitedRooms(USER_UUID, req);

            assertThat(resp.getLast()).isTrue();
            assertThat(resp.getRooms()).hasSize(3);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. getFrequentVisitedRooms() — 자주 방문한 방 (페이지네이션 동일 패턴)
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getFrequentVisitedRooms — 자주 방문 방 목록 페이지네이션")
    class GetFrequentVisitedRooms {

        @Test
        @DisplayName("정상: 마지막 페이지이면 last=true")
        void getFrequentVisitedRooms_lastPage_lastTrue() {
            given(roomVisitHistoriesMapper.findFrequentVisitedRooms(eq(USER_UUID), eq(11), eq(0)))
                    .willReturn(List.of(mock(MainRoomResponse.class)));

            RoomVisitSearchRequest req = makeRequest(0, 10);
            MainRoomPageResponse resp = service.getFrequentVisitedRooms(USER_UUID, req);

            assertThat(resp.getLast()).isTrue();
        }

        @Test
        @DisplayName("실패: null userUuid → SecurityException")
        void getFrequentVisitedRooms_nullUser_throwsSecurity() {
            assertThatThrownBy(() -> service.getFrequentVisitedRooms(null, makeRequest(0, 10)))
                    .isInstanceOf(SecurityException.class);
        }

        @Test
        @DisplayName("조회 시 deleteExpiredVisitHistoriesByUserUuid 호출됨")
        void getFrequentVisitedRooms_callsDeleteExpired() {
            given(roomVisitHistoriesMapper.findFrequentVisitedRooms(eq(USER_UUID), anyInt(), anyInt()))
                    .willReturn(java.util.List.of());

            service.getFrequentVisitedRooms(USER_UUID, makeRequest(0, 10));

            verify(roomVisitHistoriesMapper).deleteExpiredVisitHistoriesByUserUuid(USER_UUID);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. getRecentVisitedRooms — 만료 이력 삭제 검증
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getRecentVisitedRooms — 조회 시 deleteExpiredVisitHistoriesByUserUuid 호출됨")
    void getRecentVisitedRooms_callsDeleteExpired() {
        // 조회 전에 해당 사용자의 만료된 방문 이력을 정리하는 메서드가 호출돼야 함
        given(roomVisitHistoriesMapper.findRecentVisitedRooms(
                eq(USER_UUID), anyInt(), anyInt()))
                .willReturn(java.util.List.of());

        MainRoomPageResponse resp = service.getRecentVisitedRooms(USER_UUID, makeRequest(0, 10));

        verify(roomVisitHistoriesMapper).deleteExpiredVisitHistoriesByUserUuid(USER_UUID);
        assertThat(resp.getPage()).isEqualTo(0);
        assertThat(resp.getSize()).isEqualTo(10);
        assertThat(resp.getRooms()).isEmpty();
        assertThat(resp.getLast()).isTrue();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    private RoomVisitSearchRequest makeRequest(int page, int size) {
        RoomVisitSearchRequest req = new RoomVisitSearchRequest();
        req.setPage(page);
        req.setSize(size);
        return req;
    }
}
