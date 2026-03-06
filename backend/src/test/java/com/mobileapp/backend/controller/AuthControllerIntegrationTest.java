package com.mobileapp.backend.controller;

import tools.jackson.databind.json.JsonMapper;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import com.mobileapp.backend.service.EmailService;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JsonMapper jsonMapper;
    @Autowired private VerificationTokenRepository tokenRepository;

    @MockitoBean private EmailService emailService;

    private RegisterRequest newUserRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("integrationuser");
        request.setEmail("integration@example.com");
        request.setPassword("password123");
        request.setFirstName("Integration");
        request.setLastName("Test");
        return request;
    }

    private void registerUser(RegisterRequest request) throws Exception {
        doNothing().when(emailService).sendVerificationEmail(any(), any(), any(Locale.class));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private String getVerificationToken() {
        ArgumentCaptor<VerificationToken> captor = ArgumentCaptor.forClass(VerificationToken.class);
        verify(emailService).sendVerificationEmail(any(User.class), captor.capture(), any(Locale.class));
        return captor.getValue().getToken();
    }

    @Test
    void register_andVerify_andLogin_fullFlow() throws Exception {
        RegisterRequest request = newUserRequest();
        registerUser(request);

        String token = getVerificationToken();

        mockMvc.perform(get("/api/auth/verify").param("token", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationuser");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("integrationuser"));
    }

    @Test
    void register_duplicateUsername_returns400() throws Exception {
        RegisterRequest request = newUserRequest();
        registerUser(request);

        RegisterRequest duplicate = newUserRequest();
        duplicate.setEmail("other@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username is already taken"));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        RegisterRequest request = newUserRequest();
        registerUser(request);

        RegisterRequest duplicate = newUserRequest();
        duplicate.setUsername("otheruser");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already registered"));
    }

    @Test
    void login_unverifiedUser_returns403() throws Exception {
        RegisterRequest request = newUserRequest();
        registerUser(request);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("integrationuser");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        // The admin user is already created and verified by AdminInitializer
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_nonexistentUser_returns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistent");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void verify_invalidToken_returns400() throws Exception {
        mockMvc.perform(get("/api/auth/verify").param("token", "nonexistent"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verify_expiredToken_returns400() throws Exception {
        RegisterRequest request = newUserRequest();
        registerUser(request);

        String token = getVerificationToken();

        // Expire the token in the database
        VerificationToken vt = tokenRepository.findByToken(token).orElseThrow();
        vt.setExpiryDate(java.time.LocalDateTime.now().minusHours(1));
        tokenRepository.save(vt);

        mockMvc.perform(get("/api/auth/verify").param("token", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Verification token has expired. Please register again."));
    }
}
