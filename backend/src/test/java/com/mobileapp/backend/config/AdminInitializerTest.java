package com.mobileapp.backend.config;

import com.mobileapp.backend.entity.Role;
import com.mobileapp.backend.entity.Role.RoleName;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.repository.RoleRepository;
import com.mobileapp.backend.repository.UserRepository;
import com.mobileapp.backend.util.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminInitializerTest {

    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private AdminInitializer adminInitializer;

    @BeforeEach
    void setUp() {
        adminInitializer = new AdminInitializer(roleRepository, userRepository, passwordEncoder);
        ReflectionTestUtils.setField(adminInitializer, "adminUsername", "admin");
        ReflectionTestUtils.setField(adminInitializer, "adminPassword", "admin");
        ReflectionTestUtils.setField(adminInitializer, "adminEmail", "admin@test.com");
    }

    @Test
    void run_adminNotExists_createsAdmin() {
        Role adminRole = TestDataFactory.createAdminRole();
        Role userRole = TestDataFactory.createUserRole();
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(roleRepository.findByName(RoleName.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("admin")).thenReturn("encodedAdmin");

        adminInitializer.run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("admin");
        assertThat(saved.getEmail()).isEqualTo("admin@test.com");
        assertThat(saved.getPassword()).isEqualTo("encodedAdmin");
        assertThat(saved.isEnabled()).isTrue();
        assertThat(saved.getRoles()).containsExactlyInAnyOrder(adminRole, userRole);
    }

    @Test
    void run_adminExists_passwordChanged_updatesPassword() {
        User existingAdmin = TestDataFactory.createAdminUser();
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingAdmin));
        when(passwordEncoder.matches("admin", existingAdmin.getPassword())).thenReturn(false);
        when(passwordEncoder.encode("admin")).thenReturn("newEncodedPassword");

        adminInitializer.run();

        assertThat(existingAdmin.getPassword()).isEqualTo("newEncodedPassword");
        verify(userRepository).save(existingAdmin);
    }

    @Test
    void run_adminExists_passwordSame_skips() {
        User existingAdmin = TestDataFactory.createAdminUser();
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingAdmin));
        when(passwordEncoder.matches("admin", existingAdmin.getPassword())).thenReturn(true);

        adminInitializer.run();

        verify(userRepository, never()).save(any());
    }

    @Test
    void run_adminRoleNotFound_throwsIllegalStateException() {
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminInitializer.run())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ROLE_ADMIN not found");
    }
}
