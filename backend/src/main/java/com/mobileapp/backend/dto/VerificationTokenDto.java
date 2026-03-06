package com.mobileapp.backend.dto;

import com.mobileapp.backend.entity.VerificationToken;

import java.time.LocalDateTime;

public class VerificationTokenDto {

    private Long id;
    private String token;
    private LocalDateTime expiryDate;
    private boolean expired;

    public static VerificationTokenDto fromEntity(VerificationToken entity) {
        VerificationTokenDto dto = new VerificationTokenDto();
        dto.setId(entity.getId());
        dto.setToken(entity.getToken());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setExpired(entity.isExpired());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    @Override
    public String toString() {
        return "VerificationTokenDto{id=" + id + ", token='" + token +
                "', expiryDate=" + expiryDate + ", expired=" + expired + "}";
    }
}
