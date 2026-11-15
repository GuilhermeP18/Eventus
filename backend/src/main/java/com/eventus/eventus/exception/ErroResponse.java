package com.eventus.eventus.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

/** Formato único de erro da API. O campo "campos" só aparece em erros de validação. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(Instant timestamp, int status, String erro, String mensagem,
                           Map<String, String> campos) {

    public static ErroResponse de(HttpStatus status, String mensagem) {
        return de(status, mensagem, null);
    }

    public static ErroResponse de(HttpStatus status, String mensagem, Map<String, String> campos) {
        return new ErroResponse(Instant.now(), status.value(), status.getReasonPhrase(), mensagem, campos);
    }
}
