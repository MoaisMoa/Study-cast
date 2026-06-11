package com.younghee.studycast.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.config.StudyRoomPolicyProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomImageStorageServiceImpl implements RoomImageStorageService{

    private final StudyRoomPolicyProperties studyRoomPolicyProperties;

    @Override
    public String store(MultipartFile image) {
        // 1. 이미지가 첨부되지 않았거나 빈 파일이면 null 반환
        if (image == null || image.isEmpty()) {
            return null;
        }
        // 2. 이미지 용량, MIME 타입, 확장자 검증하고
        // 검증을 통과한 확장자 반환받음
        String extension = validateImage(image);
        // 3. 파일명 중복 방지를 위해 UUID 기반 저장 파일명 생성
        String storedFileName = UUID.randomUUID() + "." + extension;
        // 4. properties에 설정된 이미지 저장 폴더 경로 조회
        // 절대 경로로 변환하고 불필요한 경로 요소 정리
        Path uploadDirectory = Path.of(
            studyRoomPolicyProperties.getImage().getUploadDir()
        ).toAbsolutePath().normalize();

        try {
            // 5. 이미지 저장 폴더가 없으면 자동 생성
            Files.createDirectories(uploadDirectory);
            // 6. 저장 폴더 경로와 UUID 파일명을 결합해 최종 저장 경로 생성
            Path targetPath = uploadDirectory.resolve(storedFileName).normalize();    
            // 7. 최종 저장 경로가 설정한 업로드 폴더 밖으로 벗어나는지 확인
            if (!targetPath.startsWith(uploadDirectory)) {
                throw new IllegalArgumentException("올바르지 않은 이미지 경로입니다.");
            } 
            // 8. 업로드된 이미지 데이터를 InputStream으로 읽기
            try(InputStream inputStream = image.getInputStream()) {
                // 9. 이미지를 실제 서버 디렉터리에 저장
                // 같은 이름의 파일이 있으면 덮어쓰기
                Files.copy(
                    inputStream, 
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
                );
            }
        } catch (IOException e) {
            // 10. 파일 읽기 또는 저장에 실패하면 서버 처리 예외 발생
            throw new IllegalStateException("대표 이미지 저장에 실패했습니다", e);
        }
        // 11. 실제 디스크 경로가 아니라 프론트에서 이미지에 접근할 수 있는 URL 경로 반환
        // 반환값은 rooms.room_thumbnail에 저장
        return "/room-images/" + storedFileName;
    }

    // 추가
    // 스터디방 생성 롤백 시 파일 삭제
    @Override
    public void delete(String imagePath) {
        // 1. 이미지 경로가 없거나 빈 문자열이면 삭제할 파일이 없으므로 종료
        if (imagePath == null || imagePath.isBlank()) {
            return;
        }
        // 2. DB에 저장된 이미지 접근 경로에서 실제 저장 파일명 추출
        String storedFileName = extractStoredFileName(imagePath);
        // 3. properties에 설정된 실제 이미지 업로드 폴더 경로 조회
        // 절대 경로로 변환하고 불필요한 경로 요소 정리
        Path uploadDirectory = Path.of(
            studyRoomPolicyProperties.getImage().getUploadDir()
        ).toAbsolutePath().normalize();
        // 4. 업로드 폴더와 저장 파일명을 결합해 삭제 대상 파일의 실제 경로 생성
        Path targetPath = uploadDirectory.resolve(storedFileName).normalize();
        // 5. 삭제 대상 경로가 설정된 업로드 폴더 밖으로 벗어나는지 검증
        // 서버의 다른 파일이 삭제되는 경로 조작 공격 방지
        if (!targetPath.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("올바르지 않은 이미지 경로입니다.");
        }

        try {
            // 6. 삭제 대상 파일이 존재하면 실제 서버 디렉터리에서 삭제
            // 파일이 존재하지 않으면 예외 없이 false를 반환하고 종료
            Files.deleteIfExists(targetPath);
        } catch (IOException e) {
            // 7. 서버에서 실제 파일 삭제에 실패한 경우 서버 처리 예외 발생
            throw new IllegalStateException("대표 이미지 삭제에 실패했습니다.", e);
        }
    }

    private String validateImage(MultipartFile image) {
        // 1. properties에 설정된 최대 이미지 용량 조회
        long maxSize = studyRoomPolicyProperties.getImage().getMaxSize();
        // 2. 이미지 파일이 최대 용량을 초과하는지 검증
        if (image.getSize() > maxSize) {
            throw new IllegalArgumentException("대표 이미지는 5MB 이하의 파일만 업로드할 수 있습니다.");
        }
        // 3. 업로드 파일의 MIME 타입 조회
        // image/jpeg, image/png
        String contentType = image.getContentType();
        // 4. properties에 설정된 허용 MIME 타입 목록 조회
        List<String> allowedTypes =
            studyRoomPolicyProperties.getImage().getAllowedTypes();
        // 5. MIME 타입이 없거나 허용 목록에 없으면 예외 발생
        // MIME 타입 검증 위치
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new IllegalArgumentException("대표 이미지는 JPG, JPEG, PNG 형식만 업로드할 수 있습니다.");
        }
        // 6. 파일명과 확장자 존재 여부 및 허용 확장자 검증
        return extractExtension(image);
    }

    private String extractExtension(MultipartFile image) {
        // 1. 사용자가 업로드한 원본 파일명 조회
        String originalFilename = image.getOriginalFilename();
        // 2. 원본 파일명이 없거나 공백이면 예외 발생
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("이미지 파일명이 올바르지 않습니다.");
        }
        // 3. 파일명에서 마지막 점(.)의 위치 조회
        int dotIndex = originalFilename.lastIndexOf('.');
        // 4. 점이 없거나 점 뒤에 문자가 없으면 확장자가 없는 파일로 판단
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            throw new IllegalArgumentException("이미지 확장자를 확인할 수 없습니다.");
        }
        // 5. 점 뒤 문자열을 확장자로 추출하고 소문자로 변환
        String extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        // 6. 확장자가 jpg, jpeg, png인지 검증
        if (!extension.equals("jpg") && !extension.equals("jpeg") && !extension.equals("png")) {
            throw new IllegalArgumentException("대표 이미지는 JPG, JPEG, PNG 형식만 업로드할 수 있습니다.");
        }
        // 7. 검증을 통과한 확장자 반환
        return extension;
    }

    private String extractStoredFileName(String imagePath) {
        // 1. 이미지 접근 경로에서 마지막 구분자 위치 조회
        int slashIndex = Math.max(
            imagePath.lastIndexOf('/'), 
            imagePath.lastIndexOf('\\') 
        );
        // 2. 경로에서 실제 저장 파일명만 추출
        String storedFileName =
            slashIndex >= 0
                ? imagePath.substring(slashIndex + 1)
                : imagePath;
        // 3. 추출된 파일명이 없으면 잘못된 경로로 판단
        if (storedFileName.isBlank()) {
            throw new IllegalArgumentException("이미지 파일 경로가 올바르지 않습니다.");
        }
        // 4. 실제 저장 파일명 반환
        return storedFileName;
    }
    
}
