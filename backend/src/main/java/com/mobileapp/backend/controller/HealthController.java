package com.mobileapp.backend.controller;

import org.springframework.boot.actuate.health.CompositeHealth;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class HealthController {

    private final HealthEndpoint healthEndpoint;

    public HealthController(HealthEndpoint healthEndpoint) {
        this.healthEndpoint = healthEndpoint;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        HealthComponent healthComponent = healthEndpoint.health();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", healthComponent.getStatus().getCode());

        Map<String, Object> components = new LinkedHashMap<>();
        if (healthComponent instanceof CompositeHealth compositeHealth
                && compositeHealth.getComponents() != null) {
            for (Map.Entry<String, HealthComponent> entry : compositeHealth.getComponents().entrySet()) {
                Map<String, Object> componentData = new LinkedHashMap<>();
                componentData.put("status", entry.getValue().getStatus().getCode());

                if (entry.getValue() instanceof Health h
                        && h.getDetails() != null && !h.getDetails().isEmpty()) {
                    componentData.put("details", h.getDetails());
                } else if (entry.getValue() instanceof CompositeHealth nested
                        && nested.getDetails() != null && !nested.getDetails().isEmpty()) {
                    componentData.put("details", nested.getDetails());
                }

                components.put(entry.getKey(), componentData);
            }
        }

        response.put("components", components);
        return response;
    }
}
