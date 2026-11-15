package com.eventus.eventus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CadastroRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Pattern(regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}", message = "CPF inválido") String cpf,
        @NotNull @Past LocalDate dataNascimento,
        @NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String senha,
        @NotNull @Valid EnderecoDto endereco) {
}
