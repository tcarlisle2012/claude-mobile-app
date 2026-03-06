package com.mobileapp.backend.controller;

import tools.jackson.databind.json.JsonMapper;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JsonMapper jsonMapper;
    @Autowired private UserRepository userRepository;

    @MockitoBean private EmailService emailService;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // Login as admin (created by AdminInitializer on startup)
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("admin");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        adminToken = jsonMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    private Long registerUnverifiedUser() throws Exception {
        doNothing().when(emailService).sendVerificationEmail(any(), any(), any(Locale.class));

        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("testuser@example.com");
        request.setPassword("password123");
        request.setFirstName("Test");
        request.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        return userRepository.findByUsername("testuser").orElseThrow().getId();
    }

    private String getRegularUserToken() throws Exception {
        doNothing().when(emailService).sendVerificationEmail(any(), any(), any(Locale.class));

        RegisterRequest request = new RegisterRequest();
        request.setUsername("regularuser");
        request.setEmail("regular@example.com");
        request.setPassword("password123");
        request.setFirstName("Regular");
        request.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)));

        // Capture token and verify
        ArgumentCaptor<VerificationToken> captor = ArgumentCaptor.forClass(VerificationToken.class);
        verify(emailService).sendVerificationEmail(any(User.class), captor.capture(), any(Locale.class));
        String verifyToken = captor.getValue().getToken();

        mockMvc.perform(get("/api/auth/verify").param("token", verifyToken));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("regularuser");
        loginRequest.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(loginRequest)))
                .andReturn();

        return jsonMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    // --- getAllUsers ---

    @Test
    void getAllUsers_asAdmin_returnsUserList() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].username").value("admin"));
    }

    @Test
    void getAllUsers_asRegularUser_returns403() throws Exception {
        String regularToken = getRegularUserToken();

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    // --- getUserById ---

    @Test
    void getUserById_asAdmin_returnsUser() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        mockMvc.perform(get("/api/admin/users/" + admin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void getUserById_notFound_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/users/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    // --- updateUser ---

    @Test
    void updateUser_asAdmin_updatesSuccessfully() throws Exception {
        Long userId = registerUnverifiedUser();

        UpdateUserRequest updateRequest = new UpdateUserRequest();
        updateRequest.setFirstName("UpdatedFirst");
        updateRequest.setLastName("UpdatedLast");
        updateRequest.setEmail("updated@example.com");

        mockMvc.perform(put("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("UpdatedFirst"))
                .andExpect(jsonPath("$.lastName").value("UpdatedLast"))
                .andExpect(jsonPath("$.email").value("updated@example.com"));
    }

    // --- toggleEnabled / toggleLocked ---

    @Test
    void toggleEnabled_asAdmin_togglingWorks() throws Exception {
        Long userId = registerUnverifiedUser();

        // First toggle: disabled → enabled (user starts disabled)
        mockMvc.perform(put("/api/admin/users/" + userId + "/toggle-enabled")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));

        // Second toggle: enabled → disabled
        mockMvc.perform(put("/api/admin/users/" + userId + "/toggle-enabled")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    void toggleLocked_asAdmin_togglingWorks() throws Exception {
        Long userId = registerUnverifiedUser();

        // First toggle: accountNonLocked=true → false
        mockMvc.perform(put("/api/admin/users/" + userId + "/toggle-locked")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNonLocked").value(false));

        // Second toggle: false → true
        mockMvc.perform(put("/api/admin/users/" + userId + "/toggle-locked")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNonLocked").value(true));
    }

    // --- deleteUser ---

    @Test
    void deleteUser_asAdmin_removesUser() throws Exception {
        Long userId = registerUnverifiedUser();

        mockMvc.perform(delete("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify user is gone
        mockMvc.perform(get("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    // --- token operations ---

    @Test
    void tokenOperations_fullCycle() throws Exception {
        Long userId = registerUnverifiedUser();

        // GET token - should exist (created during registration)
        mockMvc.perform(get("/api/admin/users/" + userId + "/token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // DELETE token
        mockMvc.perform(delete("/api/admin/users/" + userId + "/token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // GET token - should be gone
        mockMvc.perform(get("/api/admin/users/" + userId + "/token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "No verification token exists for this user"));

        // POST regenerate - should create new token
        mockMvc.perform(post("/api/admin/users/" + userId + "/token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
