package com.mobileapp.backend.security;

import com.mobileapp.backend.dto.FailedAuthAttempt;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class FailedAuthAttemptStore {

    private static final int MAX_ENTRIES = 100;
    private final ConcurrentLinkedDeque<FailedAuthAttempt> attempts = new ConcurrentLinkedDeque<>();

    public void record(HttpServletRequest request, int status) {
        String ip = resolveIpAddress(request);
        String method = request.getMethod();
        String path = request.getServletPath();

        attempts.addFirst(new FailedAuthAttempt(ip, method, path, status));

        while (attempts.size() > MAX_ENTRIES) {
            attempts.removeLast();
        }
    }

    public List<FailedAuthAttempt> getRecentAttempts() {
        return new ArrayList<>(attempts);
    }

    public void clear() {
        attempts.clear();
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
