package com.mobileapp.backend.util;

import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.entity.Role;
import com.mobileapp.backend.entity.Role.RoleName;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public final class TestDataFactory {

    private TestDataFactory() {}

    // --- Roles ---

    public static Role createUserRole() {
        Role role = new Role(RoleName.ROLE_USER);
        role.setId(1L);
        return role;
    }

    public static Role createAdminRole() {
        Role role = new Role(RoleName.ROLE_ADMIN);
        role.setId(2L);
        return role;
    }

    // --- Users ---

    public static User createUser() {
        User user = new User("testuser", "test@example.com", "encodedPassword",
                "John", "Doe");
        user.setId(1L);
        user.setEnabled(true);
        user.setAccountNonLocked(true);
        user.setRoles(new HashSet<>(Set.of(createUserRole())));
        user.setCreatedAt(LocalDateTime.of(2025, 1, 1, 0, 0));
        return user;
    }

    public static User createDisabledUser() {
        User user = createUser();
        user.setEnabled(false);
        return user;
    }

    public static User createLockedUser() {
        User user = createUser();
        user.setAccountNonLocked(false);
        return user;
    }

    public static User createAdminUser() {
        User user = new User("admin", "admin@example.com", "encodedPassword",
                "System", "Administrator");
        user.setId(2L);
        user.setEnabled(true);
        user.setAccountNonLocked(true);
        user.setRoles(new HashSet<>(Set.of(createAdminRole(), createUserRole())));
        user.setCreatedAt(LocalDateTime.of(2025, 1, 1, 0, 0));
        return user;
    }

    // --- Verification Tokens ---

    public static VerificationToken createVerificationToken(User user) {
        VerificationToken token = new VerificationToken(user);
        token.setId(1L);
        return token;
    }

    public static VerificationToken createExpiredVerificationToken(User user) {
        VerificationToken token = new VerificationToken(user);
        token.setId(1L);
        token.setExpiryDate(LocalDateTime.now().minusHours(1));
        return token;
    }

    // --- DTOs ---

    public static RegisterRequest createRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setFirstName("Jane");
        request.setLastName("Smith");
        return request;
    }

    public static LoginRequest createLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        return request;
    }

    public static UpdateUserRequest createUpdateUserRequest() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Updated");
        request.setLastName("User");
        request.setEmail("updated@example.com");
        return request;
    }
}
