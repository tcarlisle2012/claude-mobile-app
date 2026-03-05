package com.mobileapp.backend.config;

import com.mobileapp.backend.entity.Role;
import com.mobileapp.backend.entity.Role.RoleName;
import com.mobileapp.backend.entity.User;
import com.mobileapp.backend.repository.RoleRepository;
import com.mobileapp.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Seeds the admin user on first startup.
 * <p>
 * Roles are managed by Liquibase (005-seed-roles.yaml).
 * The admin user is created here at runtime because BCrypt
 * generates a unique random salt each time the password is hashed.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.email:admin@mobileapp.com}")
    private String adminEmail;

    public AdminInitializer(RoleRepository roleRepository,
                            UserRepository userRepository,
                            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername(adminUsername)) {
            User existing = userRepository.findByUsername(adminUsername).get();
            if (!passwordEncoder.matches(adminPassword, existing.getPassword())) {
                existing.setPassword(passwordEncoder.encode(adminPassword));
                userRepository.save(existing);
                logger.info("Admin user '{}' password updated.", adminUsername);
            } else {
                logger.info("Admin user '{}' already exists, skipping.", adminUsername);
            }
            return;
        }

        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException(
                        "ROLE_ADMIN not found — ensure Liquibase seed changeset has run"));
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException(
                        "ROLE_USER not found — ensure Liquibase seed changeset has run"));

        User admin = new User(
                adminUsername,
                adminEmail,
                passwordEncoder.encode(adminPassword),
                "System",
                "Administrator"
        );
        admin.setEnabled(true);
        admin.setRoles(Set.of(adminRole, userRole));
        userRepository.save(admin);

        logger.info("Admin user created: username='{}', email='{}'",
                adminUsername, adminEmail);
    }
}
