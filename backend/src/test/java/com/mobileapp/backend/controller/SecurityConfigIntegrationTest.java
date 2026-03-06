package com.mobileapp.backend.controller;

import tools.jackson.databind.json.JsonMapper;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityConfigIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JsonMapper jsonMapper;

    @MockitoBean private EmailService emailService;

    @Test
    void publicEndpoints_accessible_without_auth() throws Exception {
        // Auth endpoints should not return 401
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("sectest");
        registerRequest.setEmail("sectest@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setFirstName("Sec");
        registerRequest.setLastName("Test");

        doNothing().when(emailService).sendVerificationEmail(any(), any(), any(Locale.class));

        // Register should return 201, not 401
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Login with bad credentials returns 401 (from BadCredentials, not from security filter)
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistent");
        loginRequest.setPassword("badpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // Verify with bad token returns 400, not 401
        mockMvc.perform(get("/api/auth/verify").param("token", "badtoken"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedEndpoints_return401_without_auth() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpoints_return403_for_regularUser() throws Exception {
        doNothing().when(emailService).sendVerificationEmail(any(), any(), any(Locale.class));

        // Register and verify a regular user
        RegisterRequest request = new RegisterRequest();
        request.setUsername("regularuser2");
        request.setEmail("regular2@example.com");
        request.setPassword("password123");
        request.setFirstName("Regular");
        request.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)));

        ArgumentCaptor<VerificationToken> captor = ArgumentCaptor.forClass(VerificationToken.class);
        verify(emailService).sendVerificationEmail(any(User.class), captor.capture(), any(Locale.class));

        mockMvc.perform(get("/api/auth/verify")
                .param("token", captor.getValue().getToken()));

        // Login as regular user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("regularuser2");
        loginRequest.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andReturn();

        String token = jsonMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Access admin endpoint → 403
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void corsHeaders_present() throws Exception {
        mockMvc.perform(get("/api/auth/verify")
                        .param("token", "test")
                        .header("Origin", "http://localhost:8081"))
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    void csrfDisabled_postWithoutCsrfToken_works() throws Exception {
        // POST without CSRF token should not return 403 for CSRF
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("wrongpass");

        // This should return 401 (bad credentials), not 403 (CSRF)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sessionStateless_noCookieSet() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("admin");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        // Should not have JSESSIONID — null means no cookie at all (stateless), which is correct
        assertThat(setCookie == null || !setCookie.contains("JSESSIONID")).isTrue();
    }
}
