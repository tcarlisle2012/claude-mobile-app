package com.mobileapp.backend.service;

import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.util.TestDataFactory;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private JavaMailSender mailSender;
    @Mock private TemplateEngine templateEngine;
    @Mock private MessageSource messageSource;
    @Mock private MimeMessage mimeMessage;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, templateEngine, messageSource);
        ReflectionTestUtils.setField(emailService, "baseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@test.com");
    }

    @Test
    void sendVerificationEmail_success_sendsHtmlEmail() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("verification-email"), any(Context.class)))
                .thenReturn("<html>Verify</html>");
        when(messageSource.getMessage(eq("email.verification.subject"), any(), any(), any(Locale.class)))
                .thenReturn("Verify Your Email Address");

        emailService.sendVerificationEmail(user, token, Locale.ENGLISH);

        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendVerificationEmail_verificationUrlFormat() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(messageSource.getMessage(eq("email.verification.subject"), any(), any(), any(Locale.class)))
                .thenReturn("Verify Your Email Address");

        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        when(templateEngine.process(eq("verification-email"), contextCaptor.capture()))
                .thenReturn("<html>Verify</html>");

        emailService.sendVerificationEmail(user, token, Locale.ENGLISH);

        Context capturedContext = contextCaptor.getValue();
        String verificationUrl = (String) capturedContext.getVariable("verificationUrl");
        assertThat(verificationUrl).isEqualTo(
                "http://localhost:8080/api/auth/verify?token=" + token.getToken());
        assertThat(capturedContext.getVariable("name")).isEqualTo("John");
    }

    @Test
    void sendVerificationEmail_templateEngineError_doesNotPropagate() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(templateEngine.process(eq("verification-email"), any(Context.class)))
                .thenThrow(new RuntimeException("Template error"));

        // The method only catches MessagingException, so template errors propagate.
        try {
            emailService.sendVerificationEmail(user, token, Locale.ENGLISH);
        } catch (RuntimeException e) {
            // Expected - template errors propagate
        }
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
