package com.mobileapp.backend.service;

import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MessageSource messageSource;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.username:noreply@mobileapp.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine,
                        MessageSource messageSource) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.messageSource = messageSource;
    }

    @Async
    public void sendVerificationEmail(User user, VerificationToken token, Locale locale) {
        try {
            String verificationUrl = baseUrl + "/api/auth/verify?token=" + token.getToken();

            Context context = new Context(locale);
            context.setVariable("name", user.getFirstName());
            context.setVariable("verificationUrl", verificationUrl);
            String htmlContent = templateEngine.process("verification-email", context);

            String subject = messageSource.getMessage(
                    "email.verification.subject", null, "Verify Your Email Address", locale);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (MessagingException e) {
            logger.error("Failed to send verification email to {}", user.getEmail(), e);
        }
    }
}
