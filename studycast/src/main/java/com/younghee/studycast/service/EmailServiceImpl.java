package com.younghee.studycast.service;

import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendPasswordResetCode(String toEmail, String code) {
        // Email sending is disabled in this build. Replace this stub with a proper mail sender
        // once the Spring Mail dependency is added to the project.
        System.out.println("[EmailService] sendPasswordResetCode to=" + toEmail + " code=" + code);
    }
    
}
