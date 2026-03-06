package com.mobileapp.backend.dto;

import java.util.List;

public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;

    public AuthResponse(String accessToken, String username, String email,
                        String firstName, String lastName, List<String> roles) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = roles;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    @Override
    public String toString() {
        return "AuthResponse{username='" + username + "', email='" + email +
                "', firstName='" + firstName + "', lastName='" + lastName +
                "', roles=" + roles + "}";
    }
}
