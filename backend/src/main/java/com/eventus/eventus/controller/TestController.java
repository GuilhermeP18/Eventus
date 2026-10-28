package com.eventus.eventus.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @GetMapping
    public Map<String, String> healthCheck() {
        return Map.of("status", "UP", "message", "API Eventus rodando com sucesso!");
    }
}