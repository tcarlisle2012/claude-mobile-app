package com.mobileapp.backend.controller;

import com.mobileapp.backend.dto.ApiResponse;
import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PutMapping("/users/{id}/toggle-enabled")
    public ResponseEntity<UserDto> toggleEnabled(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserEnabled(id));
    }

    @PutMapping("/users/{id}/toggle-locked")
    public ResponseEntity<UserDto> toggleLocked(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserLocked(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }

    @GetMapping("/users/{id}/token")
    public ResponseEntity<?> getVerificationToken(@PathVariable Long id) {
        VerificationTokenDto token = userService.getVerificationToken(id);
        if (token == null) {
            return ResponseEntity.ok(ApiResponse.success("No verification token exists for this user"));
        }
        return ResponseEntity.ok(token);
    }

    @DeleteMapping("/users/{id}/token")
    public ResponseEntity<ApiResponse> deleteVerificationToken(@PathVariable Long id) {
        userService.deleteVerificationToken(id);
        return ResponseEntity.ok(ApiResponse.success("Verification token deleted successfully"));
    }

    @PostMapping("/users/{id}/token")
    public ResponseEntity<VerificationTokenDto> regenerateVerificationToken(
            @PathVariable Long id) {
        return ResponseEntity.ok(userService.regenerateVerificationToken(id));
    }
}
