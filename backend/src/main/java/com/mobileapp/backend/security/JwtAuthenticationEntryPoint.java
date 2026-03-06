package com.mobileapp.backend.security;

import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final MessageSource messageSource;
    private final FailedAuthAttemptStore failedAuthAttemptStore;

    public JwtAuthenticationEntryPoint(MessageSource messageSource,
                                       FailedAuthAttemptStore failedAuthAttemptStore) {
        this.messageSource = messageSource;
        this.failedAuthAttemptStore = failedAuthAttemptStore;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        failedAuthAttemptStore.record(request, HttpServletResponse.SC_UNAUTHORIZED);

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String errorLabel = messageSource.getMessage(
                "auth.error.unauthorized", null, "Unauthorized", request.getLocale());

        Map<String, Object> body = Map.of(
                "status", HttpServletResponse.SC_UNAUTHORIZED,
                "error", errorLabel,
                "message", authException.getMessage(),
                "path", request.getServletPath()
        );

        jsonMapper.writeValue(response.getOutputStream(), body);
    }
}
