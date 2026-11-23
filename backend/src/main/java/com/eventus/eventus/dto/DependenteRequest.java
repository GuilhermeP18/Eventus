package com.eventus.eventus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record DependenteRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @Past LocalDate dataNascimento) {
}
