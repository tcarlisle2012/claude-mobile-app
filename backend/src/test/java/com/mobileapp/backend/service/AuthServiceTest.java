package com.mobileapp.backend.service;

import com.mobileapp.backend.dto.AuthResponse;
import com.mobileapp.backend.dto.LoginRequest;
import com.mobileapp.backend.dto.RegisterRequest;
import com.mobileapp.backend.entity.Role;
import com.mobileapp.backend.entity.Role.RoleName;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.RoleRepository;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import com.mobileapp.backend.security.JwtTokenProvider;
import com.mobileapp.backend.util.Messages;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private VerificationTokenRepository tokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;
    @Mock private Messages messages;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setUp() {
        // Make the Messages mock return the key itself as the message string
        lenient().when(messages.get(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(messages.get(anyString(), any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void register_success_createsUserAndSendsEmail() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        Role userRole = TestDataFactory.createUserRole();

        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashedPassword");

        String result = authService.register(request);

        assertThat(result).isEqualTo("auth.success.registration");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getUsername()).isEqualTo("newuser");
        assertThat(savedUser.getPassword()).isEqualTo("hashedPassword");
        assertThat(savedUser.isEnabled()).isFalse();
        assertThat(savedUser.getRoles()).contains(userRole);

        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq(savedUser), any(VerificationToken.class), any(Locale.class));
    }

    @Test
    void register_duplicateUsername_throwsIllegalArgument() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("auth.error.username-taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateEmail_throwsIllegalArgument() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("auth.error.email-registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_roleNotFound_throwsResourceNotFoundException() {
        RegisterRequest request = TestDataFactory.createRegisterRequest();
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(com.mobileapp.backend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("error.role-not-found");
    }

    @Test
    void verifyEmail_validToken_enablesUser() {
        User user = TestDataFactory.createDisabledUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(tokenRepository.findByToken(token.getToken())).thenReturn(Optional.of(token));

        String result = authService.verifyEmail(token.getToken());

        assertThat(result).isEqualTo("auth.success.email-verified");
        assertThat(user.isEnabled()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).delete(token);
    }

    @Test
    void verifyEmail_invalidToken_throwsIllegalArgument() {
        when(tokenRepository.findByToken("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("invalid"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("auth.error.invalid-token");
    }

    @Test
    void verifyEmail_expiredToken_deletesAndThrows() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createExpiredVerificationToken(user);
        when(tokenRepository.findByToken(token.getToken())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.verifyEmail(token.getToken()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("auth.error.token-expired");

        verify(tokenRepository).delete(token);
    }

    @Test
    void login_success_returnsAuthResponse() {
        LoginRequest request = TestDataFactory.createLoginRequest();
        User user = TestDataFactory.createUser();
        Authentication auth = mock(Authentication.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtTokenProvider.generateToken(auth)).thenReturn("jwt-token");
        when(userRepository.findByUsername(request.getUsername())).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getRoles()).contains("ROLE_USER");
    }

    @Test
    void login_badCredentials_propagatesException() {
        LoginRequest request = TestDataFactory.createLoginRequest();
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }
}
