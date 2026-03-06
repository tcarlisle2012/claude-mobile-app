package com.mobileapp.backend.controller;

import org.springframework.boot.health.actuate.endpoint.CompositeHealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.health.actuate.endpoint.IndicatedHealthDescriptor;
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
        HealthDescriptor healthDescriptor = healthEndpoint.health();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", healthDescriptor.getStatus().getCode());

        Map<String, Object> components = new LinkedHashMap<>();
        if (healthDescriptor instanceof CompositeHealthDescriptor compositeHealth
                && compositeHealth.getComponents() != null) {
            for (Map.Entry<String, HealthDescriptor> entry : compositeHealth.getComponents().entrySet()) {
                Map<String, Object> componentData = new LinkedHashMap<>();
                componentData.put("status", entry.getValue().getStatus().getCode());

                if (entry.getValue() instanceof IndicatedHealthDescriptor ind
                        && ind.getDetails() != null && !ind.getDetails().isEmpty()) {
                    componentData.put("details", ind.getDetails());
                } else if (entry.getValue() instanceof CompositeHealthDescriptor nested
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
