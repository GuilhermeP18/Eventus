package com.eventus.eventus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Dados que o próprio usuário pode alterar. E-mail e CPF ficam de fora de propósito. */
public record AtualizarPerfilRequest(
        @NotBlank @Size(max = 120) String nome,
        @Pattern(regexp = "\\d{10,11}", message = "Telefone deve ter 10 ou 11 dígitos") String telefone,
        @NotNull @Past LocalDate dataNascimento,
        @NotNull @Valid EnderecoDto endereco) {
}
