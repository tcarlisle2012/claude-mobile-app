package com.mobileapp.backend.controller;

import com.mobileapp.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.CompositeHealth;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.Constructor;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private HealthEndpoint healthEndpoint;
    @MockitoBean private EmailService emailService;

    @SuppressWarnings("unchecked")
    private static CompositeHealth createCompositeHealth(Status status, Map<String, HealthComponent> components) {
        try {
            Constructor<CompositeHealth> ctor = CompositeHealth.class.getDeclaredConstructor(
                    org.springframework.boot.actuate.endpoint.ApiVersion.class, Status.class, Map.class);
            ctor.setAccessible(true);
            return ctor.newInstance(org.springframework.boot.actuate.endpoint.ApiVersion.V3, status, components);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create CompositeHealth", e);
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_asAdmin_returns200WithComponents() throws Exception {
        Map<String, HealthComponent> components = new LinkedHashMap<>();
        components.put("db", Health.up().withDetail("database", "H2").build());
        components.put("diskSpace", Health.up().withDetail("total", 500000000L).withDetail("free", 300000000L).build());

        when(healthEndpoint.health()).thenReturn(createCompositeHealth(Status.UP, components));

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.db.status").value("UP"))
                .andExpect(jsonPath("$.components.db.details.database").value("H2"))
                .andExpect(jsonPath("$.components.diskSpace.status").value("UP"))
                .andExpect(jsonPath("$.components.diskSpace.details.total").value(500000000));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_asAdmin_withDownComponent_returnsCorrectStatus() throws Exception {
        Map<String, HealthComponent> components = new LinkedHashMap<>();
        components.put("db", Health.down().withDetail("error", "Connection refused").build());

        when(healthEndpoint.health()).thenReturn(createCompositeHealth(Status.DOWN, components));

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.components.db.status").value("DOWN"))
                .andExpect(jsonPath("$.components.db.details.error").value("Connection refused"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_asAdmin_noComponents_returnsEmptyComponents() throws Exception {
        when(healthEndpoint.health()).thenReturn(Health.up().build());

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").isEmpty());
    }

    @Test
    @WithMockUser(roles = "USER")
    void getHealth_asUser_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getHealth_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isUnauthorized());
    }
}
