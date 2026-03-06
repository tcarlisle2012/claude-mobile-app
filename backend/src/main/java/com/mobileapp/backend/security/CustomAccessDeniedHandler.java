package com.mobileapp.backend.security;

import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final MessageSource messageSource;
    private final FailedAuthAttemptStore failedAuthAttemptStore;

    public CustomAccessDeniedHandler(MessageSource messageSource,
                                     FailedAuthAttemptStore failedAuthAttemptStore) {
        this.messageSource = messageSource;
        this.failedAuthAttemptStore = failedAuthAttemptStore;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        failedAuthAttemptStore.record(request, HttpServletResponse.SC_FORBIDDEN);

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        String errorLabel = messageSource.getMessage(
                "auth.error.access-denied", null, "Forbidden", request.getLocale());

        Map<String, Object> body = Map.of(
                "status", HttpServletResponse.SC_FORBIDDEN,
                "error", errorLabel,
                "message", accessDeniedException.getMessage(),
                "path", request.getServletPath()
        );

        jsonMapper.writeValue(response.getOutputStream(), body);
    }
}
