package com.jvmcrew.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.from:noreply@engineerspace.app}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public boolean isConfigured() {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        return sender != null && StringUtils.hasText(mailHost);
    }

    public String getFrontendUrl() {
        return StringUtils.hasText(frontendUrl) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
    }

    public boolean sendPasswordResetEmail(String toEmail, String recipientName, String resetLink) {
        if (!isConfigured()) {
            log.info("SMTP Email provider is not configured. Password reset link for '{}': {}", toEmail, resetLink);
            return false;
        }

        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                log.warn("JavaMailSender bean is unavailable.");
                return false;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "EngineerSpace");
            helper.setTo(toEmail);
            helper.setSubject("Reset Your EngineerSpace Password");

            String displayName = StringUtils.hasText(recipientName) ? recipientName : "Engineer";

            String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F4EF; color: #17201C; margin: 0; padding: 24px; }
                    .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #D8D6CE; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { text-align: center; margin-bottom: 24px; }
                    .badge { display: inline-block; font-size: 11px; font-family: monospace; font-weight: 700; color: #2D5A43; background: #E4EEE8; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
                    h1 { font-size: 20px; font-weight: 800; color: #17201C; margin: 12px 0 8px 0; }
                    p { font-size: 14px; line-height: 1.6; color: #59635D; margin: 12px 0; }
                    .btn-wrapper { text-align: center; margin: 28px 0; }
                    .btn { display: inline-block; background-color: #2D5A43; color: #FFFFFF !important; text-decoration: none; font-weight: 700; font-size: 13px; font-family: monospace; padding: 12px 24px; border-radius: 8px; }
                    .meta { font-size: 12px; color: #7B827D; font-family: monospace; border-top: 1px solid #ECEAE2; padding-top: 16px; margin-top: 24px; }
                    .link-break { word-break: break-all; font-size: 11px; color: #2D5A43; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <span class="badge">EngineerSpace Security</span>
                      <h1>Password Reset Request</h1>
                    </div>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>We received a request to reset the password for your EngineerSpace workspace account.</p>
                    <p>Click the button below to choose a new password. This reset link is single-use and will expire in <strong>30 minutes</strong>.</p>
                    <div class="btn-wrapper">
                      <a href="%s" class="btn">RESET PASSWORD</a>
                    </div>
                    <p>If you did not request a password reset, you can safely ignore this email — your account remains secure and no changes will be made.</p>
                    <div class="meta">
                      <p style="margin: 0 0 6px 0;">Button not working? Copy and paste this URL into your browser:</p>
                      <a href="%s" class="link-break">%s</a>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(displayName, resetLink, resetLink, resetLink);

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Password reset email sent successfully to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
