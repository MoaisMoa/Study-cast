package com.younghee.studycast.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService{
    
    private final JavaMailSender javaMailSender;

    @Override
    public void sendPasswordResetCode(String toEmail, String code) {
        
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("[스터디캐스트] 비밀번호 재설정 인증번호");
        message.setText(
            "안녕하세요. 스터디캐스트입니다.\n\n" +
            "비밀번호 재설정 인증번호는 아래와 같습니다.\n\n" +
            "인증번호: " + code + "\n\n" +
            "인증번호는 5분 동안만 유효합니다. \n" +
            "본인이 요청하지 않았다면 이 메일을 무시하세요."
        );

        javaMailSender.send(message);
    }
    
}
