package com.eventus.eventus.dto;

public record TokenResponse(String token, String tipo) {

    public static TokenResponse bearer(String token) {
        return new TokenResponse(token, "Bearer");
    }
}
