package com.mobileapp.backend.service;

import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import com.mobileapp.backend.util.Messages;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final Messages messages;

    public UserService(UserRepository userRepository,
                       VerificationTokenRepository tokenRepository,
                       EmailService emailService,
                       Messages messages) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.messages = messages;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", id)));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", id)));

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(messages.get("auth.error.email-registered"));
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto toggleUserEnabled(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", id)));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto toggleUserLocked(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", id)));
        user.setAccountNonLocked(!user.isAccountNonLocked());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", id)));
        tokenRepository.findByUserId(user.getId()).ifPresent(tokenRepository::delete);
        tokenRepository.flush();
        userRepository.delete(user);
    }

    public VerificationTokenDto getVerificationToken(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", userId)));

        return tokenRepository.findByUserId(userId)
                .map(VerificationTokenDto::fromEntity)
                .orElse(null);
    }

    @Transactional
    public void deleteVerificationToken(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", userId)));
        tokenRepository.findByUserId(userId).ifPresent(tokenRepository::delete);
    }

    @Transactional
    public VerificationTokenDto regenerateVerificationToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(messages.get("user.error.not-found-with-id", userId)));

        tokenRepository.findByUserId(userId).ifPresent(tokenRepository::delete);
        tokenRepository.flush();

        VerificationToken newToken = new VerificationToken(user);
        tokenRepository.save(newToken);

        Locale currentLocale = LocaleContextHolder.getLocale();
        emailService.sendVerificationEmail(user, newToken, currentLocale);

        return VerificationTokenDto.fromEntity(newToken);
    }
}
