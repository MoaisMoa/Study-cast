package com.younghee.studycast.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendPasswordResetCode(String toEmail, String code) {
        String subject = "[Study-cast] 비밀번호 재설정 인증번호";
        String html = """
            <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #eee;">
              <h2 style="color:#E53935;font-size:20px;margin-bottom:8px;">Study-cast</h2>
              <p style="color:#333;font-size:15px;margin-bottom:24px;">비밀번호 재설정 인증번호입니다.</p>
              <div style="background:#FFF5F5;border-radius:8px;padding:20px;text-align:center;letter-spacing:0.3em;font-size:28px;font-weight:700;color:#E53935;font-family:monospace;">
                %s
              </div>
              <p style="color:#888;font-size:12px;margin-top:20px;">인증번호는 10분간 유효합니다. 본인이 요청하지 않았다면 무시해주세요.</p>
            </div>
            """.formatted(code);
        send(toEmail, subject, html);
    }

    @Override
    public void sendSignupLinkCode(String toEmail, String code) {
        String subject = "[Study-cast] 계정 연결 인증번호";
        String html = """
            <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #eee;">
              <h2 style="color:#E53935;font-size:20px;margin-bottom:8px;">Study-cast</h2>
              <p style="color:#333;font-size:15px;margin-bottom:24px;">소셜 계정에 비밀번호를 연결하기 위한 인증번호입니다.</p>
              <div style="background:#FFF5F5;border-radius:8px;padding:20px;text-align:center;letter-spacing:0.3em;font-size:28px;font-weight:700;color:#E53935;font-family:monospace;">
                %s
              </div>
              <p style="color:#888;font-size:12px;margin-top:20px;">인증번호는 5분간 유효합니다. 본인이 요청하지 않았다면 무시해주세요.</p>
            </div>
            """.formatted(code);
        send(toEmail, subject, html);
    }

    @Override
    public void sendRoomInvitation(String toEmail, String roomTitle, String roomLink, String joinCode) {
        String subject = "[Study-cast] 스터디룸 초대장 — " + roomTitle;

        String joinCodeBlock = (joinCode != null && !joinCode.isBlank())
            ? """
              <div style="margin-top:16px;">
                <p style="color:#555;font-size:13px;margin-bottom:6px;">비공개 방입니다. 아래 코드로 입장하세요.</p>
                <div style="background:#FFF5F5;border-radius:8px;padding:14px;text-align:center;letter-spacing:0.3em;font-size:24px;font-weight:700;color:#E53935;font-family:monospace;">
                  %s
                </div>
              </div>
              """.formatted(joinCode)
            : "";

        String html = """
            <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #eee;">
              <h2 style="color:#E53935;font-size:20px;margin-bottom:4px;">Study-cast</h2>
              <p style="color:#888;font-size:13px;margin-bottom:24px;border-bottom:1px solid #eee;padding-bottom:16px;">함께 공부하는 온라인 스터디룸</p>

              <p style="color:#333;font-size:15px;margin-bottom:6px;">스터디룸에 초대되었습니다.</p>
              <p style="color:#111;font-size:18px;font-weight:700;margin-bottom:24px;">"%s"</p>

              <a href="%s"
                style="display:block;text-align:center;background:#E53935;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 0;border-radius:10px;">
                스터디룸 입장하기
              </a>
              %s
              <p style="color:#aaa;font-size:11px;margin-top:28px;border-top:1px solid #eee;padding-top:14px;">
                이 메일은 Study-cast에서 자동 발송되었습니다. 본인이 요청하지 않은 경우 무시해주세요.
              </p>
            </div>
            """.formatted(roomTitle, roomLink, joinCodeBlock);

        send(toEmail, subject, html);
    }

    private void send(String toEmail, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("[Email] sent to={} subject={}", toEmail, subject);
        } catch (MessagingException e) {
            log.error("[Email] failed to={} reason={}", toEmail, e.getMessage());
            throw new IllegalStateException("이메일 발송에 실패했습니다.", e);
        }
    }
}
