package com.eventus.eventus.service;

import org.springframework.http.HttpStatus;

public class AuthException extends RuntimeException {
    private final HttpStatus status;
    private final String field;
    private final Long retryAfterMs;

    public AuthException(HttpStatus status, String message, String field) {
        this(status, message, field, null);
    }

    public AuthException(HttpStatus status, String message, String field, Long retryAfterMs) {
        super(message);
        this.status = status;
        this.field = field;
        this.retryAfterMs = retryAfterMs;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getField() {
        return field;
    }

    public Long getRetryAfterMs() {
        return retryAfterMs;
    }
}
