package com.younghee.studycast.handler;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 요청값 오류
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn(">>>IllegalArgumentException 발생: {}", e.getMessage());

        return ResponseEntity
            .badRequest()
            .body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
    }

    // 현재 상태상 처리 불가
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateException(IllegalStateException e) {
        log.warn(">>>IllegalStateException 발생: {}", e.getMessage());

        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
    }

    // 조회 대상 없음
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNoSuchElementException(NoSuchElementException e) {
        log.warn(">>>NoSuchElementException 발생: {}", e.getMessage());

        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
    }

    // 인증/보안 오류
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurityException(SecurityException e) {
        log.warn(">>>SecurityException 발생: {}", e.getMessage());

        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
    }

    // 그 외 RuntimeException 공통 처리
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.warn(">>>RuntimeException 발생: {}", e.getMessage());

        return ResponseEntity
            .badRequest()
            .body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
    }

    // 예상하지 못한 서버 오류 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("서버 오류 발생", e);

        return ResponseEntity
            .internalServerError()
            .body(Map.of(
                "success", false,
                "message", "서버 오류가 발생했습니다."
            ));
    }
}