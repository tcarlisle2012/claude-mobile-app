package com.mobileapp.backend.service;

import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import com.mobileapp.backend.util.Messages;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private VerificationTokenRepository tokenRepository;
    @Mock private EmailService emailService;
    @Mock private Messages messages;

    @InjectMocks private UserService userService;

    @BeforeEach
    void setUp() {
        lenient().when(messages.get(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(messages.get(anyString(), any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    // --- getAllUsers ---

    @Test
    void getAllUsers_returnsMappedDtos() {
        User user1 = TestDataFactory.createUser();
        User user2 = TestDataFactory.createAdminUser();
        when(userRepository.findAll()).thenReturn(List.of(user1, user2));

        List<UserDto> result = userService.getAllUsers();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUsername()).isEqualTo("testuser");
        assertThat(result.get(1).getUsername()).isEqualTo("admin");
    }

    @Test
    void getAllUsers_emptyList_returnsEmpty() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        List<UserDto> result = userService.getAllUsers();

        assertThat(result).isEmpty();
    }

    // --- getUserById ---

    @Test
    void getUserById_found_returnsDto() {
        User user = TestDataFactory.createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserDto result = userService.getUserById(1L);

        assertThat(result.getUsername()).isEqualTo("testuser");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void getUserById_notFound_throwsIllegalArgument() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("user.error.not-found-with-id");
    }

    // --- updateUser ---

    @Test
    void updateUser_success_updatesFields() {
        User user = TestDataFactory.createUser();
        UpdateUserRequest request = TestDataFactory.createUpdateUserRequest();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDto result = userService.updateUser(1L, request);

        assertThat(user.getFirstName()).isEqualTo("Updated");
        assertThat(user.getLastName()).isEqualTo("User");
        assertThat(user.getEmail()).isEqualTo("updated@example.com");
        verify(userRepository).save(user);
    }

    @Test
    void updateUser_emailConflict_throwsIllegalArgument() {
        User user = TestDataFactory.createUser();
        UpdateUserRequest request = TestDataFactory.createUpdateUserRequest();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUser(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("auth.error.email-registered");
    }

    @Test
    void updateUser_sameEmail_doesNotCheckDuplicate() {
        User user = TestDataFactory.createUser();
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFirstName("Updated");
        request.setLastName("User");
        request.setEmail(user.getEmail()); // same email
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.updateUser(1L, request);

        verify(userRepository, never()).existsByEmail(any());
        verify(userRepository).save(user);
    }

    @Test
    void updateUser_notFound_throwsIllegalArgument() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(99L, TestDataFactory.createUpdateUserRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("user.error.not-found-with-id");
    }

    // --- toggleUserEnabled ---

    @Test
    void toggleUserEnabled_flipsEnabledFlag() {
        User user = TestDataFactory.createUser(); // enabled=true
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.toggleUserEnabled(1L);

        assertThat(user.isEnabled()).isFalse();
        verify(userRepository).save(user);
    }

    @Test
    void toggleUserEnabled_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.toggleUserEnabled(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- toggleUserLocked ---

    @Test
    void toggleUserLocked_flipsLockedFlag() {
        User user = TestDataFactory.createUser(); // accountNonLocked=true
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.toggleUserLocked(1L);

        assertThat(user.isAccountNonLocked()).isFalse();
        verify(userRepository).save(user);
    }

    @Test
    void toggleUserLocked_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.toggleUserLocked(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- deleteUser ---

    @Test
    void deleteUser_withToken_deletesTokenThenUser() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.of(token));

        userService.deleteUser(1L);

        InOrder inOrder = inOrder(tokenRepository, userRepository);
        inOrder.verify(tokenRepository).delete(token);
        inOrder.verify(tokenRepository).flush();
        inOrder.verify(userRepository).delete(user);
    }

    @Test
    void deleteUser_noToken_deletesUserOnly() {
        User user = TestDataFactory.createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.empty());

        userService.deleteUser(1L);

        verify(tokenRepository, never()).delete(any(VerificationToken.class));
        verify(userRepository).delete(user);
    }

    @Test
    void deleteUser_notFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- getVerificationToken ---

    @Test
    void getVerificationToken_exists_returnsDto() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.of(token));

        VerificationTokenDto result = userService.getVerificationToken(1L);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo(token.getToken());
    }

    @Test
    void getVerificationToken_noToken_returnsNull() {
        User user = TestDataFactory.createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.empty());

        VerificationTokenDto result = userService.getVerificationToken(1L);

        assertThat(result).isNull();
    }

    @Test
    void getVerificationToken_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getVerificationToken(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- deleteVerificationToken ---

    @Test
    void deleteVerificationToken_success() {
        User user = TestDataFactory.createUser();
        VerificationToken token = TestDataFactory.createVerificationToken(user);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.of(token));

        userService.deleteVerificationToken(1L);

        verify(tokenRepository).delete(token);
    }

    @Test
    void deleteVerificationToken_noToken_noOp() {
        User user = TestDataFactory.createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.empty());

        userService.deleteVerificationToken(1L);

        verify(tokenRepository, never()).delete(any(VerificationToken.class));
    }

    @Test
    void deleteVerificationToken_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteVerificationToken(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- regenerateVerificationToken ---

    @Test
    void regenerateVerificationToken_success() {
        User user = TestDataFactory.createUser();
        VerificationToken oldToken = TestDataFactory.createVerificationToken(user);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.of(oldToken));

        VerificationTokenDto result = userService.regenerateVerificationToken(1L);

        assertThat(result).isNotNull();

        InOrder inOrder = inOrder(tokenRepository, emailService);
        inOrder.verify(tokenRepository).delete(oldToken);
        inOrder.verify(tokenRepository).flush();
        inOrder.verify(tokenRepository).save(any(VerificationToken.class));
        inOrder.verify(emailService).sendVerificationEmail(eq(user), any(VerificationToken.class), any(Locale.class));
    }

    @Test
    void regenerateVerificationToken_noExistingToken_createsNew() {
        User user = TestDataFactory.createUser();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenRepository.findByUserId(1L)).thenReturn(Optional.empty());

        VerificationTokenDto result = userService.regenerateVerificationToken(1L);

        assertThat(result).isNotNull();
        verify(tokenRepository, never()).delete(any(VerificationToken.class));
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq(user), any(VerificationToken.class), any(Locale.class));
    }

    @Test
    void regenerateVerificationToken_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.regenerateVerificationToken(99L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
