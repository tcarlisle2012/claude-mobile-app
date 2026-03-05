package com.mobileapp.backend.service;

import com.mobileapp.backend.dto.AuthResponse;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.entity.Role;
import com.mobileapp.backend.entity.Role.RoleName;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.exception.ResourceNotFoundException;
import com.mobileapp.backend.repository.RoleRepository;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import com.mobileapp.backend.security.JwtTokenProvider;
import com.mobileapp.backend.util.Messages;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final Messages messages;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       VerificationTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       EmailService emailService,
                       Messages messages) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.messages = messages;
    }

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException(messages.get("auth.error.username-taken"));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(messages.get("auth.error.email-registered"));
        }

        // Create user with hashed password (BCrypt includes salt automatically)
        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFirstName(),
                request.getLastName()
        );

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new ResourceNotFoundException(messages.get("error.role-not-found")));
        user.setRoles(new HashSet<>(Set.of(userRole)));
        user.setEnabled(false); // Disabled until email verification

        userRepository.save(user);

        // Create and send verification token
        VerificationToken verificationToken = new VerificationToken(user);
        tokenRepository.save(verificationToken);

        Locale currentLocale = LocaleContextHolder.getLocale();
        emailService.sendVerificationEmail(user, verificationToken, currentLocale);

        return messages.get("auth.success.registration");
    }

    @Transactional
    public String verifyEmail(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("auth.error.invalid-token")));

        if (verificationToken.isExpired()) {
            tokenRepository.delete(verificationToken);
            throw new IllegalArgumentException(messages.get("auth.error.token-expired"));
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);

        return messages.get("auth.success.email-verified");
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException(messages.get("user.error.not-found")));

        var roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        return new AuthResponse(jwt, user.getUsername(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roles);
    }
}
