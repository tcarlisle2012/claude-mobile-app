package com.mobileapp.backend.controller;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class MetricsController {

    private final MeterRegistry meterRegistry;

    public MetricsController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        List<Map<String, Object>> httpRequestMetrics = new ArrayList<>();

        meterRegistry.find("http.server.requests").timers().forEach(timer -> {
            Map<String, Object> metric = new LinkedHashMap<>();
            metric.put("method", getTag(timer, "method"));
            metric.put("uri", getTag(timer, "uri"));
            metric.put("status", getTag(timer, "status"));
            metric.put("count", timer.count());
            metric.put("totalTimeMs", round(timer.totalTime(TimeUnit.MILLISECONDS)));
            metric.put("meanTimeMs", round(timer.mean(TimeUnit.MILLISECONDS)));
            metric.put("maxTimeMs", round(timer.max(TimeUnit.MILLISECONDS)));
            httpRequestMetrics.add(metric);
        });

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("httpRequestMetrics", httpRequestMetrics);
        return ResponseEntity.ok(response);
    }

    private static String getTag(Timer timer, String key) {
        String value = timer.getId().getTag(key);
        return value != null ? value : "";
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
