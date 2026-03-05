package com.mobileapp.backend;

import com.mobileapp.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

    @MockitoBean private EmailService emailService;

    @Test
    void contextLoads() {
    }
}
