package com.mobileapp.backend.security;

import tools.jackson.databind.json.JsonMapper;
import com.mobileapp.backend.dto.FailedAuthAttempt;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationEntryPointTest {

    private final MessageSource messageSource = mock(MessageSource.class);
    private final FailedAuthAttemptStore store = new FailedAuthAttemptStore();
    private final JwtAuthenticationEntryPoint entryPoint = new JwtAuthenticationEntryPoint(messageSource, store);
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void commence_returns401JsonResponse() throws Exception {
        when(messageSource.getMessage(eq("auth.error.unauthorized"), any(), anyString(), any(Locale.class)))
                .thenReturn("Unauthorized");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/user/me");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response,
                new BadCredentialsException("Full authentication is required"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = jsonMapper.readValue(
                response.getContentAsString(), Map.class);
        assertThat(body.get("status")).isEqualTo(401);
        assertThat(body.get("error")).isEqualTo("Unauthorized");
        assertThat(body.get("message")).isEqualTo("Full authentication is required");
        assertThat(body.get("path")).isEqualTo("/api/user/me");
    }

    @Test
    void commence_recordsFailedAttemptInStore() throws Exception {
        when(messageSource.getMessage(anyString(), any(), anyString(), any(Locale.class)))
                .thenReturn("Unauthorized");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/admin/health");
        request.setRemoteAddr("10.0.0.5");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response,
                new BadCredentialsException("No token"));

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getStatus()).isEqualTo(401);
        assertThat(attempts.get(0).getIpAddress()).isEqualTo("10.0.0.5");
        assertThat(attempts.get(0).getPath()).isEqualTo("/api/admin/health");
    }
}
