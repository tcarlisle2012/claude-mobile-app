package com.mobileapp.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mobileapp.backend.dto.FailedAuthAttempt;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CustomAccessDeniedHandlerTest {

    private final MessageSource messageSource = mock(MessageSource.class);
    private final FailedAuthAttemptStore store = new FailedAuthAttemptStore();
    private final CustomAccessDeniedHandler handler = new CustomAccessDeniedHandler(messageSource, store);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void handle_returns403JsonResponse() throws Exception {
        when(messageSource.getMessage(eq("auth.error.access-denied"), any(), anyString(), any(Locale.class)))
                .thenReturn("Forbidden");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setServletPath("/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.handle(request, response, new AccessDeniedException("Access is denied"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/json");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = objectMapper.readValue(response.getContentAsString(), Map.class);
        assertThat(body.get("status")).isEqualTo(403);
        assertThat(body.get("error")).isEqualTo("Forbidden");
        assertThat(body.get("path")).isEqualTo("/api/admin/users");
    }

    @Test
    void handle_recordsFailedAttemptInStore() throws Exception {
        when(messageSource.getMessage(anyString(), any(), anyString(), any(Locale.class)))
                .thenReturn("Forbidden");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/metrics");
        request.setServletPath("/api/admin/metrics");
        request.setRemoteAddr("192.168.1.50");
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler.handle(request, response, new AccessDeniedException("Access is denied"));

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(403);
        assertThat(attempts.get(0).getIpAddress()).isEqualTo("192.168.1.50");
        assertThat(attempts.get(0).getPath()).isEqualTo("/api/admin/metrics");
    }
}
