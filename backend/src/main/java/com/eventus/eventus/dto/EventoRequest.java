package com.eventus.eventus.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record EventoRequest(
        @NotBlank @Size(max = 150) String titulo,
        @Size(max = 2000) String descricao,
        @NotNull LocalDateTime data,
        @NotBlank @Size(max = 255) String local,
        @NotNull @Min(1) Integer capacidade,
        @NotNull LocalDateTime inscricaoInicio,
        @NotNull LocalDateTime inscricaoFim) {
}
