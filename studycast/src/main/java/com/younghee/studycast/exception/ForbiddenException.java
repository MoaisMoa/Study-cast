package com.younghee.studycast.exception;

// 로그인은 됐지만 해당 동작에 대한 권한이 없는 경우 (예: 방장만 가능한 동작을 일반 멤버가 시도) — 401과 구분되는 403
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
