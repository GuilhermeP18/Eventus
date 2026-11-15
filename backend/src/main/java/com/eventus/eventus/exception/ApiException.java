package com.eventus.eventus.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Erro de negócio com o status HTTP que deve ser devolvido. */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }
}
