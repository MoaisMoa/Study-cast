package com.younghee.studycast.service;

public interface EmailService {
    // 비밀번호 재설정 인증번호 발송
    void sendPasswordResetCode(String toEmail, String code);

    // 스터디룸 초대 이메일 발송
    void sendRoomInvitation(String toEmail, String roomTitle, String roomLink, String joinCode);
}
