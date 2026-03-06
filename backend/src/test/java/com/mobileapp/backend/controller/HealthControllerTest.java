package com.mobileapp.backend.controller;

import com.mobileapp.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.*;
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
    private CompositeHealth createCompositeHealth(Status status, Map<String, HealthComponent> components) throws Exception {
        Class<?> apiVersionClass = Class.forName("org.springframework.boot.actuate.endpoint.ApiVersion");
        Object apiVersionV3 = null;
        for (Object constant : apiVersionClass.getEnumConstants()) {
            if ("V3".equals(((Enum<?>) constant).name())) {
                apiVersionV3 = constant;
                break;
            }
        }
        Constructor<CompositeHealth> ctor = CompositeHealth.class.getDeclaredConstructor(
                apiVersionClass, Status.class, Map.class);
        ctor.setAccessible(true);
        return ctor.newInstance(apiVersionV3, status, components);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_returnsStatusAndComponents() throws Exception {
        Map<String, HealthComponent> components = new LinkedHashMap<>();
        components.put("db", Health.up().withDetail("database", "H2").build());
        components.put("ping", Health.up().build());

        CompositeHealth composite = createCompositeHealth(Status.UP, components);
        when(healthEndpoint.health()).thenReturn(composite);

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.db.status").value("UP"))
                .andExpect(jsonPath("$.components.db.details.database").value("H2"))
                .andExpect(jsonPath("$.components.ping.status").value("UP"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_returnsDownStatus() throws Exception {
        Map<String, HealthComponent> components = new LinkedHashMap<>();
        components.put("db", Health.down().withDetail("error", "Connection refused").build());

        CompositeHealth composite = createCompositeHealth(Status.DOWN, components);
        when(healthEndpoint.health()).thenReturn(composite);

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.components.db.status").value("DOWN"))
                .andExpect(jsonPath("$.components.db.details.error").value("Connection refused"));
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

    @Test
    @WithMockUser(roles = "ADMIN")
    void getHealth_emptyComponents() throws Exception {
        CompositeHealth composite = createCompositeHealth(Status.UP, new LinkedHashMap<>());
        when(healthEndpoint.health()).thenReturn(composite);

        mockMvc.perform(get("/api/admin/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").isEmpty());
    }
}
