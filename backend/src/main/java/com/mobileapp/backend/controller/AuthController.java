package com.mobileapp.backend.controller;

import com.mobileapp.backend.dto.ApiResponse;
import com.mobileapp.backend.dto.AuthResponse;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message));
    }

    @GetMapping("/verify")
    public ApiResponse verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmail(token);
        return ApiResponse.success(message);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
