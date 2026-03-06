package com.mobileapp.backend.controller;

import com.mobileapp.backend.service.EmailService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.TimeUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

    private void recordTestTimer(String method, String uri, String statusCode, int count, long avgNanos) {
        Timer timer = Timer.builder("http.server.requests")
                .tag("method", method)
                .tag("uri", uri)
                .tag("status", statusCode)
                .register(meterRegistry);
        for (int i = 0; i < count; i++) {
            timer.record(avgNanos, TimeUnit.NANOSECONDS);
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMetrics_asAdmin_returns200WithMetrics() throws Exception {
        recordTestTimer("GET", "/api/test/endpoint", "200", 5, 50_000_000L);

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.httpRequestMetrics").isArray())
                .andExpect(jsonPath("$.httpRequestMetrics.length()").value(
                        org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMetrics_asAdmin_returnsFailedAuthAttemptsArray() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.failedAuthAttempts").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMetrics_asAdmin_returnsCorrectStructure() throws Exception {
        recordTestTimer("POST", "/api/test/structure", "201", 3, 100_000_000L);

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/structure')].method").value("POST"))
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/structure')].status").value("201"))
                .andExpect(jsonPath("$.httpRequestMetrics[?(@.uri == '/api/test/structure')].count").value(3));
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
    void clearFailedAuth_asAdmin_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/metrics/failed-auth"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "USER")
    void clearFailedAuth_asUser_returns403() throws Exception {
        mockMvc.perform(delete("/api/admin/metrics/failed-auth"))
                .andExpect(status().isForbidden());
    }

    @Test
    void clearFailedAuth_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/admin/metrics/failed-auth"))
                .andExpect(status().isUnauthorized());
    }
}
