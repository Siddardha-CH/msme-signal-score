package com.msme.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class RootController {
    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of("message", "MSME Signal Score API", "status", "ok", "stack", "Spring Boot + PostgreSQL");
    }
}
