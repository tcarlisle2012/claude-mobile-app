package com.mobileapp.backend.exception;

import com.mobileapp.backend.dto.ApiResponse;
import com.mobileapp.backend.util.Messages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

class GlobalExceptionHandlerTest {

    private final Messages messages = mock(Messages.class);
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(messages);

    @BeforeEach
    void setUp() {
        // Return the key as the message for easy assertions
        lenient().when(messages.get(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(messages.get(anyString(), any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void handleIllegalArgument_returns400() {
        ResponseEntity<ApiResponse> response = handler.handleIllegalArgument(
                new IllegalArgumentException("test error"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("test error");
    }

    @Test
    void handleBadCredentials_returns401() {
        ResponseEntity<ApiResponse> response = handler.handleBadCredentials(
                new BadCredentialsException("bad"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("auth.error.bad-credentials");
    }

    @Test
    void handleDisabled_returns403() {
        ResponseEntity<ApiResponse> response = handler.handleDisabled(
                new DisabledException("disabled"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).isEqualTo("auth.error.account-not-verified");
    }

    @Test
    void handleLocked_returns403() {
        ResponseEntity<ApiResponse> response = handler.handleLocked(
                new LockedException("locked"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).isEqualTo("auth.error.account-locked");
    }

    @Test
    void handleAccessDenied_returns403() {
        ResponseEntity<ApiResponse> response = handler.handleAccessDenied(
                new AccessDeniedException("denied"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).isEqualTo("auth.error.access-denied");
    }

    @Test
    void handleMissingParam_returns400() {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("token", "String");
        ResponseEntity<ApiResponse> response = handler.handleMissingParam(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("error.missing-parameter");
    }

    @Test
    @SuppressWarnings("unchecked")
    void handleValidation_returns400WithFieldErrors() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(
                new Object(), "request");
        bindingResult.addError(new FieldError("request", "username", "Username is required"));
        bindingResult.addError(new FieldError("request", "email", "Email is required"));

        MethodParameter methodParameter = new MethodParameter(
                getClass().getDeclaredMethod("handleValidation_returns400WithFieldErrors"), -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(
                methodParameter, bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Map<String, Object> body = response.getBody();
        assertThat(body.get("success")).isEqualTo(false);
        assertThat(body.get("message")).isEqualTo("error.validation-failed");
        Map<String, String> errors = (Map<String, String>) body.get("errors");
        assertThat(errors).containsKeys("username", "email");
    }

    @Test
    void handleGeneral_returns500() {
        ResponseEntity<ApiResponse> response = handler.handleGeneral(
                new RuntimeException("something broke"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo("error.unexpected");
    }
}
