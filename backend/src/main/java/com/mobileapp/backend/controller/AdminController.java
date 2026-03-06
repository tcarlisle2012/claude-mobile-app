package com.mobileapp.backend.controller;

import com.mobileapp.backend.dto.ApiResponse;
import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.service.UserService;
import com.mobileapp.backend.util.Messages;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final Messages messages;

    public AdminController(UserService userService, Messages messages) {
        this.userService = userService;
        this.messages = messages;
    }

    @GetMapping("/users")
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/users/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/users/{id}")
    public UserDto updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PutMapping("/users/{id}/toggle-enabled")
    public UserDto toggleEnabled(@PathVariable Long id) {
        return userService.toggleUserEnabled(id);
    }

    @PutMapping("/users/{id}/toggle-locked")
    public UserDto toggleLocked(@PathVariable Long id) {
        return userService.toggleUserLocked(id);
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success(messages.get("admin.success.user-deleted"));
    }

    @GetMapping("/users/{id}/token")
    public Object getVerificationToken(@PathVariable Long id) {
        VerificationTokenDto token = userService.getVerificationToken(id);
        if (token == null) {
            return ApiResponse.success(messages.get("admin.info.no-token"));
        }
        return token;
    }

    @DeleteMapping("/users/{id}/token")
    public ApiResponse deleteVerificationToken(@PathVariable Long id) {
        userService.deleteVerificationToken(id);
        return ApiResponse.success(messages.get("admin.success.token-deleted"));
    }

    @PostMapping("/users/{id}/token")
    public VerificationTokenDto regenerateVerificationToken(@PathVariable Long id) {
        return userService.regenerateVerificationToken(id);
    }
}
