package com.younghee.studycast.service;

import org.springframework.web.multipart.MultipartFile;

public interface RoomImageStorageService {
    
    // 스터디방 대표 이미지 저장 후 접근 경로 반환
    String store(MultipartFile image);
    
    // 저장된 스터디방 대표 이미지 삭제
    void delete(String imagePath);
}
