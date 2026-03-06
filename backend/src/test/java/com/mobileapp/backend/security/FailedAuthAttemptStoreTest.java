package com.mobileapp.backend.security;

import com.mobileapp.backend.dto.FailedAuthAttempt;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FailedAuthAttemptStoreTest {

    private final FailedAuthAttemptStore store = new FailedAuthAttemptStore();

    @Test
    void record_storesAttemptWithCorrectFields() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        request.setServletPath("/api/admin/users");
        request.setRemoteAddr("192.168.1.100");

        store.record(request, 401);

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts).hasSize(1);
        assertThat(attempts.get(0).getIpAddress()).isEqualTo("192.168.1.100");
        assertThat(attempts.get(0).getMethod()).isEqualTo("GET");
        assertThat(attempts.get(0).getPath()).isEqualTo("/api/admin/users");
        assertThat(attempts.get(0).getStatus()).isEqualTo(401);
        assertThat(attempts.get(0).getTimestamp()).isNotNull();
    }

    @Test
    void record_usesXForwardedForWhenPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.50, 70.41.3.18");

        store.record(request, 401);

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts.get(0).getIpAddress()).isEqualTo("203.0.113.50");
    }

    @Test
    void record_usesRemoteAddrWhenNoXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/health");
        request.setServletPath("/api/admin/health");
        request.setRemoteAddr("10.0.0.1");

        store.record(request, 403);

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts.get(0).getIpAddress()).isEqualTo("10.0.0.1");
    }

    @Test
    void record_boundsAtMaxEntries() {
        for (int i = 0; i < 105; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test/" + i);
            request.setServletPath("/api/test/" + i);
            request.setRemoteAddr("10.0.0." + (i % 256));
            store.record(request, 401);
        }

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts).hasSize(100);
    }

    @Test
    void record_newestFirst() {
        MockHttpServletRequest first = new MockHttpServletRequest("GET", "/api/first");
        first.setServletPath("/api/first");
        first.setRemoteAddr("10.0.0.1");
        store.record(first, 401);

        MockHttpServletRequest second = new MockHttpServletRequest("GET", "/api/second");
        second.setServletPath("/api/second");
        second.setRemoteAddr("10.0.0.2");
        store.record(second, 403);

        List<FailedAuthAttempt> attempts = store.getRecentAttempts();
        assertThat(attempts).hasSize(2);
        assertThat(attempts.get(0).getPath()).isEqualTo("/api/second");
        assertThat(attempts.get(1).getPath()).isEqualTo("/api/first");
    }

    @Test
    void clear_removesAllAttempts() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");
        request.setServletPath("/api/test");
        request.setRemoteAddr("10.0.0.1");
        store.record(request, 401);
        store.record(request, 403);

        assertThat(store.getRecentAttempts()).hasSize(2);

        store.clear();

        assertThat(store.getRecentAttempts()).isEmpty();
    }

    @Test
    void getRecentAttempts_returnsDefensiveCopy() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");
        request.setServletPath("/api/test");
        request.setRemoteAddr("10.0.0.1");
        store.record(request, 401);

        List<FailedAuthAttempt> copy = store.getRecentAttempts();
        copy.clear();

        assertThat(store.getRecentAttempts()).hasSize(1);
    }
}
