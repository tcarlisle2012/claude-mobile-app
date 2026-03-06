package com.mobileapp.backend.controller;

import com.mobileapp.backend.service.EmailService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MetricsControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private MeterRegistry meterRegistry;

    @MockitoBean private EmailService emailService;

    private void recordTimer(String method, String uri, String statusCode, Duration duration, int count) {
        Timer timer = Timer.builder("http.server.requests")
                .tag("method", method)
                .tag("uri", uri)
                .tag("status", statusCode)
                .register(meterRegistry);
        for (int i = 0; i < count; i++) {
            timer.record(duration);
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMetrics_returnsHttpRequestMetrics() throws Exception {
        recordTimer("GET", "/api/test", "200", Duration.ofMillis(50), 5);

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.httpRequestMetrics").isArray());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getMetrics_asUser_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMetrics_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMetrics_containsExpectedFields() throws Exception {
        recordTimer("POST", "/api/test/create", "201", Duration.ofMillis(100), 3);

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/create')].method").exists())
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/create')].count").exists())
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/create')].meanTimeMs").exists())
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/create')].maxTimeMs").exists());
    }
}
