package com.mobileapp.backend.service;

import com.mobileapp.backend.dto.UpdateUserRequest;
import com.mobileapp.backend.dto.UserDto;
import com.mobileapp.backend.dto.VerificationTokenDto;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.entity.VerificationToken;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.repository.VerificationTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
                       VerificationTokenRepository tokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
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
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto toggleUserLocked(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setAccountNonLocked(!user.isAccountNonLocked());
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        tokenRepository.findByUserId(user.getId()).ifPresent(tokenRepository::delete);
        tokenRepository.flush();
        userRepository.delete(user);
    }

    public VerificationTokenDto getVerificationToken(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        return tokenRepository.findByUserId(userId)
                .map(VerificationTokenDto::fromEntity)
                .orElse(null);
    }

    @Transactional
    public void deleteVerificationToken(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        tokenRepository.findByUserId(userId).ifPresent(tokenRepository::delete);
    }

    @Transactional
    public VerificationTokenDto regenerateVerificationToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        tokenRepository.findByUserId(userId).ifPresent(tokenRepository::delete);
        tokenRepository.flush();

        VerificationToken newToken = new VerificationToken(user);
        tokenRepository.save(newToken);
        emailService.sendVerificationEmail(user, newToken);

        return VerificationTokenDto.fromEntity(newToken);
    }
}
