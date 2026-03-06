package com.mobileapp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mobileapp.backend.config.SecurityConfig;
import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.security.CustomAccessDeniedHandler;
import com.mobileapp.backend.security.CustomUserDetailsService;
import com.mobileapp.backend.security.FailedAuthAttemptStore;
import com.mobileapp.backend.security.JwtAuthenticationEntryPoint;
import com.mobileapp.backend.security.JwtAuthenticationFilter;
import com.mobileapp.backend.security.JwtTokenProvider;
import com.mobileapp.backend.service.UserService;
import com.mobileapp.backend.util.Messages;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, FailedAuthAttemptStore.class, CustomAccessDeniedHandler.class})
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private UserService userService;
    @MockitoBean private JwtTokenProvider jwtTokenProvider;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private Messages messages;

    // --- getAllUsers ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_asAdmin_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        when(userService.getAllUsers()).thenReturn(List.of(UserDto.fromEntity(user)));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllUsers_asUser_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    // --- getUser ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUser_asAdmin_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        when(userService.getUserById(1L)).thenReturn(UserDto.fromEntity(user));

        mockMvc.perform(get("/api/admin/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUser_notFound_returns400() throws Exception {
        when(userService.getUserById(99L))
                .thenThrow(new IllegalArgumentException("User not found"));

        mockMvc.perform(get("/api/admin/users/99"))
                .andExpect(status().isBadRequest());
    }

    // --- updateUser ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_asAdmin_validRequest_returns200() throws Exception {
        UpdateUserRequest request = TestDataFactory.createUpdateUserRequest();
        User user = TestDataFactory.createUser();
        user.setFirstName("Updated");
        when(userService.updateUser(eq(1L), any())).thenReturn(UserDto.fromEntity(user));

        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_invalidEmail_returns400() throws Exception {
        UpdateUserRequest request = TestDataFactory.createUpdateUserRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_missingFields_returns400() throws Exception {
        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "USER")
    void updateUser_asUser_returns403() throws Exception {
        UpdateUserRequest request = TestDataFactory.createUpdateUserRequest();

        mockMvc.perform(put("/api/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // --- toggleEnabled ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void toggleEnabled_asAdmin_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        user.setEnabled(false);
        when(userService.toggleUserEnabled(1L)).thenReturn(UserDto.fromEntity(user));

        mockMvc.perform(put("/api/admin/users/1/toggle-enabled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    // --- toggleLocked ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void toggleLocked_asAdmin_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        user.setAccountNonLocked(false);
        when(userService.toggleUserLocked(1L)).thenReturn(UserDto.fromEntity(user));

        mockMvc.perform(put("/api/admin/users/1/toggle-locked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNonLocked").value(false));
    }

    // --- deleteUser ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_asAdmin_returns200() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "USER")
    void deleteUser_asUser_returns403() throws Exception {
        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isForbidden());
    }

    // --- getVerificationToken ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void getVerificationToken_exists_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(userService.getVerificationToken(1L))
                .thenReturn(VerificationTokenDto.fromEntity(token));

        mockMvc.perform(get("/api/admin/users/1/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getVerificationToken_noToken_returns200WithMessage() throws Exception {
        when(userService.getVerificationToken(1L)).thenReturn(null);
        when(messages.get("admin.info.no-token")).thenReturn("No verification token exists for this user");

        mockMvc.perform(get("/api/admin/users/1/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("No verification token exists for this user"));
    }

    // --- deleteVerificationToken ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteVerificationToken_asAdmin_returns200() throws Exception {
        doNothing().when(userService).deleteVerificationToken(1L);

        mockMvc.perform(delete("/api/admin/users/1/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // --- regenerateVerificationToken ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void regenerateVerificationToken_asAdmin_returns200() throws Exception {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(userService.regenerateVerificationToken(1L))
                .thenReturn(VerificationTokenDto.fromEntity(token));

        mockMvc.perform(post("/api/admin/users/1/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
