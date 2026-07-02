package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import com.younghee.studycast.config.StudyRoomPolicyProperties;

/**
 * RoomImageStorageServiceImpl 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * store()  : 업로드 이미지 검증 후 서버에 저장, URL 경로 반환
 * delete() : DB에 저장된 이미지 경로로 실제 파일 삭제
 *
 * ── 테스트 범위 ───────────────────────────────────────────────────────────────
 * 이미지 검증(용량·MIME·확장자)과 null/빈 파일 처리는 파일 I/O 없이 검증 가능하다.
 * 실제 파일 저장/삭제(Files.copy / Files.deleteIfExists) 는 통합 테스트 영역이므로
 * 이 파일에서는 다루지 않는다.
 *
 * ── MockMultipartFile 개념 ────────────────────────────────────────────────────
 * MockMultipartFile 은 Spring Test 가 제공하는 가짜 파일 객체다.
 * 실제 파일 없이 파일명·MIME 타입·크기·내용을 직접 지정할 수 있어
 * 업로드 검증 로직을 단위 테스트하는 데 적합하다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RoomImageStorageServiceImpl — 방 썸네일 이미지 검증 단위 테스트")
class RoomImageStorageServiceImplTest {

    @Mock private StudyRoomPolicyProperties              policyProperties;
    @Mock private StudyRoomPolicyProperties.Image        imagePolicy;

    @InjectMocks
    private RoomImageStorageServiceImpl storageService;

    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5MB

    @BeforeEach
    void setUp() {
        // 이미지 정책 기본값 설정
        given(policyProperties.getImage()).willReturn(imagePolicy);
        given(imagePolicy.getMaxSize()).willReturn(MAX_SIZE);
        given(imagePolicy.getAllowedTypes()).willReturn(List.of("image/jpeg", "image/png"));
        // uploadDir 는 실제 파일 쓰기 전까지 호출되지 않으므로 검증 실패 테스트엔 불필요
        given(imagePolicy.getUploadDir()).willReturn("/tmp/test-uploads");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. store() — null / 빈 파일 처리
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("store() — null / 빈 파일 → null 반환 (검증 없이 조기 반환)")
    class NullOrEmptyFile {

        @Test
        @DisplayName("null 파일은 null 반환")
        void store_nullFile_returnsNull() {
            assertThat(storageService.store(null)).isNull();
        }

        @Test
        @DisplayName("비어 있는 파일(0바이트)은 null 반환")
        void store_emptyFile_returnsNull() {
            MockMultipartFile empty = new MockMultipartFile(
                    "image", "photo.jpg", "image/jpeg", new byte[0]);

            assertThat(storageService.store(empty)).isNull();
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. store() — 용량 검증
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("store() — 용량 초과 검증")
    class FileSizeValidation {

        @Test
        @DisplayName("5MB 초과 파일 → IllegalArgumentException")
        void store_exceedsMaxSize_throwsIllegalArgument() {
            byte[] overSized = new byte[(int) MAX_SIZE + 1];
            MockMultipartFile file = new MockMultipartFile(
                    "image", "big.jpg", "image/jpeg", overSized);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("5MB 이하");
        }

        @Test
        @DisplayName("정확히 5MB 파일은 용량 검증 통과 (경계값 — 이후 MIME 검증으로 진행)")
        void store_exactlyMaxSize_passesSizeValidation() {
            byte[] maxSized = new byte[(int) MAX_SIZE];
            MockMultipartFile file = new MockMultipartFile(
                    "image", "max.jpg", "image/jpeg", maxSized);

            // 용량 검증은 통과, MIME·확장자 검증도 통과하지만 실제 파일 I/O 에서 실패
            // 여기서는 IllegalArgumentException 이 아닌 다른 예외(또는 없음)임을 확인
            try {
                storageService.store(file);
            } catch (IllegalArgumentException e) {
                // 용량 초과 메시지면 실패
                assertThat(e.getMessage()).doesNotContain("5MB 이하");
            } catch (Exception ignored) {
                // 파일 I/O 예외는 허용 (단위 테스트 범위 밖)
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. store() — MIME 타입 검증
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("store() — MIME 타입 검증")
    class MimeTypeValidation {

        @Test
        @DisplayName("허용되지 않는 MIME 타입(image/gif) → IllegalArgumentException")
        void store_unsupportedMimeType_throwsIllegalArgument() {
            MockMultipartFile file = new MockMultipartFile(
                    "image", "anim.gif", "image/gif", new byte[100]);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("JPG, JPEG, PNG");
        }

        @Test
        @DisplayName("null MIME 타입 → IllegalArgumentException")
        void store_nullMimeType_throwsIllegalArgument() {
            MockMultipartFile file = new MockMultipartFile(
                    "image", "photo.jpg", null, new byte[100]);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("JPG, JPEG, PNG");
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. store() — 확장자 검증
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("store() — 확장자 검증")
    class ExtensionValidation {

        @Test
        @DisplayName("확장자 없는 파일명 → IllegalArgumentException")
        void store_noExtension_throwsIllegalArgument() {
            MockMultipartFile file = new MockMultipartFile(
                    "image", "noextension", "image/jpeg", new byte[100]);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("확장자");
        }

        @Test
        @DisplayName("MIME는 맞지만 확장자가 .gif → IllegalArgumentException")
        void store_gifExtension_throwsIllegalArgument() {
            // MIME를 jpeg로 속였지만 확장자는 gif
            MockMultipartFile file = new MockMultipartFile(
                    "image", "disguised.gif", "image/jpeg", new byte[100]);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("JPG, JPEG, PNG");
        }

        @Test
        @DisplayName("파일명이 null → IllegalArgumentException")
        void store_nullFilename_throwsIllegalArgument() {
            MockMultipartFile file = new MockMultipartFile(
                    "image", null, "image/jpeg", new byte[100]);

            assertThatThrownBy(() -> storageService.store(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("파일명");
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. delete() — null / 빈 경로는 no-op
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete() — null / 빈 경로는 파일 삭제 없이 종료")
    class DeleteNoOp {

        @Test
        @DisplayName("null 경로 → 예외 없이 종료 (삭제할 파일 없음)")
        void delete_nullPath_noOp() {
            storageService.delete(null);
            // 예외가 발생하지 않으면 성공; 매퍼 호출도 없어야 함
        }

        @Test
        @DisplayName("빈 문자열 경로 → 예외 없이 종료")
        void delete_emptyPath_noOp() {
            storageService.delete("");
        }

        @Test
        @DisplayName("공백만 있는 경로 → 예외 없이 종료")
        void delete_blankPath_noOp() {
            storageService.delete("   ");
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 6. delete() — 경로 탐색(Path Traversal) 방어
    // ────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete() — 경로 탐색 공격 방어")
    class PathTraversalDefense {

        @Test
        @DisplayName("'..' 만 있는 경로 → 업로드 폴더 밖을 가리키므로 IllegalArgumentException")
        void delete_dotDotPath_throwsIllegalArgument() {
            // ".." 을 파일명으로 넘기면 uploadDir 의 상위 폴더를 가리켜 경로 탈출 시도가 됨
            // RoomImageStorageServiceImpl은 targetPath.startsWith(uploadDirectory) 로 이를 차단
            assertThatThrownBy(() -> storageService.delete(".."))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("올바르지 않은 이미지 경로");
        }
    }
}
