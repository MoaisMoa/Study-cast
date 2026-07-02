package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;

/**
 * NoticeServiceImpl 단위 테스트
 *
 * ── 주요 기능 ────────────────────────────────────────────────────────────────
 * saveNotice()   : 방 공지 저장 (최대 500자, null/blank → null로 저장)
 * deleteNotice() : 방 공지 삭제 (notice = null 로 업데이트)
 * getNotice()    : 방 공지 조회
 *
 * ── trimToNull() 개념 ─────────────────────────────────────────────────────────
 * 내부 유틸 메서드 trimToNull():
 *   - null → null
 *   - "   " (공백만) → null
 *   - "  공지 내용  " → "공지 내용" (앞뒤 공백 제거)
 * 이를 통해 빈 공지가 의미 없는 공백 문자열로 저장되는 것을 방지한다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NoticeServiceImpl — 방 공지 서비스 단위 테스트")
class NoticeServiceImplTest {

    @Mock private RoomsMapper roomsMapper;

    @InjectMocks
    private NoticeServiceImpl noticeService;

    // ────────────────────────────────────────────────────────────────────────
    // 1. saveNotice() — 공지 저장
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("saveNotice — 실패: null DTO → IllegalArgumentException")
    void saveNotice_nullDto_throwsIllegalArgument() {
        assertThatThrownBy(() -> noticeService.saveNotice(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호가 필요합니다");
    }

    @Test
    @DisplayName("saveNotice — 실패: roomNo가 null인 DTO → IllegalArgumentException")
    void saveNotice_nullRoomNo_throwsIllegalArgument() {
        // given: roomNo 없는 DTO
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(null);

        assertThatThrownBy(() -> noticeService.saveNotice(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호가 필요합니다");
    }

    @Test
    @DisplayName("saveNotice — 실패: 공지가 500자 초과 → IllegalArgumentException")
    void saveNotice_noticeTooLong_throwsIllegalArgument() {
        // given: 501자 공지 (최대 500자)
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(1L);
        dto.setRoomNotice("가".repeat(501));

        assertThatThrownBy(() -> noticeService.saveNotice(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("500자 이하");
    }

    @Test
    @DisplayName("saveNotice — 정상: null 공지는 null 로 저장 (trimToNull)")
    void saveNotice_nullNotice_savesNull() {
        // given
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(1L);
        dto.setRoomNotice(null);

        // when
        noticeService.saveNotice(dto);

        // then: null 이 그대로 전달됐어야 함
        verify(roomsMapper).updateRoomNotice(1L, null);
    }

    @Test
    @DisplayName("saveNotice — 정상: 공백만 있는 공지는 null 로 저장 (trimToNull)")
    void saveNotice_blankNotice_savesNull() {
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(2L);
        dto.setRoomNotice("     ");

        noticeService.saveNotice(dto);

        // 공백 문자열은 trimToNull 이 null 로 변환해서 저장
        verify(roomsMapper).updateRoomNotice(2L, null);
    }

    @Test
    @DisplayName("saveNotice — 정상: 앞뒤 공백이 있는 공지는 trim 하고 저장")
    void saveNotice_paddedNotice_savesTrimmed() {
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(3L);
        dto.setRoomNotice("  오늘 공부 열심히 합시다!  ");

        noticeService.saveNotice(dto);

        // 앞뒤 공백 제거 후 저장
        verify(roomsMapper).updateRoomNotice(3L, "오늘 공부 열심히 합시다!");
    }

    @Test
    @DisplayName("saveNotice — 정상: 정확히 500자 공지는 저장 가능 (경계값)")
    void saveNotice_exactly500Chars_success() {
        RoomsDTO dto = new RoomsDTO();
        dto.setRoomNo(4L);
        dto.setRoomNotice("나".repeat(500));

        // 예외 없이 완료되면 성공
        noticeService.saveNotice(dto);

        verify(roomsMapper).updateRoomNotice(4L, "나".repeat(500));
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. deleteNotice() — 공지 삭제
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteNotice — 실패: null roomsNo → IllegalArgumentException")
    void deleteNotice_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> noticeService.deleteNotice(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호가 필요합니다");
    }

    @Test
    @DisplayName("deleteNotice — 정상: updateRoomNotice(roomNo, null) 호출")
    void deleteNotice_success() {
        // when
        noticeService.deleteNotice(5L);

        // then: notice=null 로 업데이트 (= 공지 삭제)
        verify(roomsMapper).updateRoomNotice(5L, null);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. getNotice() — 공지 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getNotice — 실패: null roomsNo → IllegalArgumentException")
    void getNotice_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> noticeService.getNotice(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호가 필요합니다");
    }

    @Test
    @DisplayName("getNotice — 방이 없으면 null 반환")
    void getNotice_roomNotFound_returnsNull() {
        // given: 방이 존재하지 않음
        given(roomsMapper.findByRoomNo(999L)).willReturn(null);

        assertThat(noticeService.getNotice(999L)).isNull();
    }

    @Test
    @DisplayName("getNotice — 방이 있으면 notice 반환")
    void getNotice_roomFound_returnsNotice() {
        // given
        RoomsDTO room = new RoomsDTO();
        room.setRoomNo(1L);
        room.setRoomNotice("스터디 공지사항입니다.");
        given(roomsMapper.findByRoomNo(1L)).willReturn(room);

        // when & then
        assertThat(noticeService.getNotice(1L)).isEqualTo("스터디 공지사항입니다.");
    }

    @Test
    @DisplayName("getNotice — 방이 존재하지만 roomNotice가 null이면 null 반환 (방 없음과 구별)")
    void getNotice_roomExistsButNoticeNull_returnsNull() {
        // 방 미존재(NoSuchElement)가 아닌, 방이 있어도 공지가 없는 경우 null 반환이어야 함
        RoomsDTO room = new RoomsDTO();
        room.setRoomNo(2L);
        room.setRoomNotice(null); // 공지 없음
        given(roomsMapper.findByRoomNo(2L)).willReturn(room);

        assertThat(noticeService.getNotice(2L)).isNull();
    }
}
