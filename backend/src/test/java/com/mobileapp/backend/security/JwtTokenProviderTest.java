package com.mobileapp.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    private static final String JWT_SECRET =
            "dGhpcyBpcyBhIHZlcnkgbG9uZyBzZWNyZXQga2V5IGZvciBKV1QgdG9rZW4gc2lnbmluZyB0aGF0IGlzIGF0IGxlYXN0IDUxMiBiaXRzIGxvbmc=";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", JWT_SECRET);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 86400000L);
    }

    private Authentication createAuthentication(String username) {
        UserDetails userDetails = new User(username, "password", Collections.emptyList());
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    @Test
    void generateToken_returnsValidJwt() {
        Authentication auth = createAuthentication("testuser");

        String token = tokenProvider.generateToken(auth);

        assertThat(token).isNotNull().isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts
    }

    @Test
    void getUsernameFromToken_extractsCorrectUsername() {
        Authentication auth = createAuthentication("testuser");
        String token = tokenProvider.generateToken(auth);

        String username = tokenProvider.getUsernameFromToken(token);

        assertThat(username).isEqualTo("testuser");
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        Authentication auth = createAuthentication("testuser");
        String token = tokenProvider.generateToken(auth);

        boolean valid = tokenProvider.validateToken(token);

        assertThat(valid).isTrue();
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", -1000L);
        Authentication auth = createAuthentication("testuser");
        String token = tokenProvider.generateToken(auth);

        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 86400000L);
        boolean valid = tokenProvider.validateToken(token);

        assertThat(valid).isFalse();
    }

    @Test
    void validateToken_malformedToken_returnsFalse() {
        boolean valid = tokenProvider.validateToken("not.a.jwt");

        assertThat(valid).isFalse();
    }

    @Test
    void validateToken_nullToken_returnsFalse() {
        boolean valid = tokenProvider.validateToken(null);

        assertThat(valid).isFalse();
    }

    @Test
    void validateToken_wrongSigningKey_returnsFalse() {
        Authentication auth = createAuthentication("testuser");
        String token = tokenProvider.generateToken(auth);

        // Change the secret key
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret",
                "YW5vdGhlciB2ZXJ5IGxvbmcgc2VjcmV0IGtleSBmb3IgSldUIHRva2VuIHNpZ25pbmcgdGhhdCBpcyBhdCBsZWFzdCA1MTIgYml0cyBsb25n");

        boolean valid = tokenProvider.validateToken(token);

        assertThat(valid).isFalse();
    }
}
