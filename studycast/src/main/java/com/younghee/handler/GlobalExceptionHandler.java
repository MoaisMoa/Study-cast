package com.younghee.handler;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // RuntimeException 공통 처리
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
                "succes", false,
                "message", "서버 오류가 발생했습니다."
            ));
    }
}
