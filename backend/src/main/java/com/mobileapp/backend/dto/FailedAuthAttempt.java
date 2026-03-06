package com.mobileapp.backend.dto;

import java.time.Instant;

public class FailedAuthAttempt {

    private final String ipAddress;
    private final String method;
    private final String path;
    private final int status;
    private final Instant timestamp;

    public FailedAuthAttempt(String ipAddress, String method, String path, int status) {
        this.ipAddress = ipAddress;
        this.method = method;
        this.path = path;
        this.status = status;
        this.timestamp = Instant.now();
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public int getStatus() {
        return status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }
}
