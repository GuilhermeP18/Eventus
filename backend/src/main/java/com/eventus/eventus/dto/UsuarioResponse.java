package com.eventus.eventus.dto;

import com.eventus.eventus.model.Usuario;

import java.time.LocalDate;

/** Nunca inclui a senha. */
public record UsuarioResponse(Long id, String nome, String email, String cpf,
                              LocalDate dataNascimento, EnderecoDto endereco) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getCpf(),
                u.getDataNascimento(), EnderecoDto.de(u.getEndereco()));
    }
}
