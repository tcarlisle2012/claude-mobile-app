package com.mobileapp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mobileapp.backend.config.SecurityConfig;
import com.mobileapp.backend.dto.AuthResponse;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.security.CustomAccessDeniedHandler;
import com.mobileapp.backend.security.CustomUserDetailsService;
import com.mobileapp.backend.security.FailedAuthAttemptStore;
import com.mobileapp.backend.security.JwtAuthenticationEntryPoint;
import com.mobileapp.backend.security.JwtAuthenticationFilter;
import com.mobileapp.backend.security.JwtTokenProvider;
import com.mobileapp.backend.service.AuthService;
import com.mobileapp.backend.util.Messages;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, FailedAuthAttemptStore.class, CustomAccessDeniedHandler.class})
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AuthService authService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private Messages messages;

    // --- register ---

    @Test
    void register_validRequest_returns201() throws Exception {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        when(authService.register(any())).thenReturn("Registration successful");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"));
    }

    @Test
    void register_missingUsername_returns400() throws Exception {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        request.setUsername("");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        request.setPassword("abc");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_missingAllFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateUsername_returns400() throws Exception {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        when(authService.register(any()))
                .thenThrow(new IllegalArgumentException("Username is already taken"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username is already taken"));
    }

    // --- verify ---

    @Test
    void verify_validToken_returns200() throws Exception {
        when(authService.verifyEmail("valid-token"))
                .thenReturn("Email verified successfully");

        mockMvc.perform(get("/api/auth/verify")
                        .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Email verified successfully"));
    }

    @Test
    void verify_invalidToken_returns400() throws Exception {
        when(authService.verifyEmail("invalid"))
                .thenThrow(new IllegalArgumentException("Invalid verification token"));

        mockMvc.perform(get("/api/auth/verify")
                        .param("token", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verify_missingTokenParam_returns400() throws Exception {
        mockMvc.perform(get("/api/auth/verify"))
                .andExpect(status().isBadRequest());
    }

    // --- login ---

    @Test
    void login_validCredentials_returns200WithJwt() throws Exception {
        LoginRequest request = TestDataFactory.createLoginRequest();
        AuthResponse authResponse = new AuthResponse(
                "jwt-token", "testuser", "test@example.com",
                "John", "Doe", List.of("ROLE_USER"));
        when(authService.login(any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"));
    }

    @Test
    void login_missingUsername_returns400() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setPassword("password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_missingPassword_returns400() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_badCredentials_returns401() throws Exception {
        LoginRequest request = TestDataFactory.createLoginRequest();
        when(authService.login(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
