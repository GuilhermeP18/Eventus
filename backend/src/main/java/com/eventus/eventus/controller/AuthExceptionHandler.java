package com.eventus.eventus.controller;

import com.eventus.eventus.dto.AuthDtos.ApiError;
import com.eventus.eventus.service.AuthException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiError> handleAuthException(AuthException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ApiError(exception.getMessage(), exception.getField(), exception.getRetryAfterMs()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDuplicateAccount(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409)
                .body(new ApiError("Já existe uma conta com este e-mail ou CPF", null, null));
    }
}
