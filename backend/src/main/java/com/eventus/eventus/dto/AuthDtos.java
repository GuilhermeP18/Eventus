package com.eventus.eventus.dto;

import java.time.LocalDate;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            String name,
            String email,
            String cpf,
            String phone,
            LocalDate birthDate,
            String responsibleEmail,
            String password) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record UserResponse(
            Long id,
            String name,
            String email,
            String phone,
            LocalDate birthDate,
            String responsibleEmail,
            boolean canCreateEvents) {
    }

    public record ApiError(String message, String field, Long retryAfterMs) {
    }
}
