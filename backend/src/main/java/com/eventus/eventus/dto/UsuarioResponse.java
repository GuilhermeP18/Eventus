package com.eventus.eventus.dto;

import com.eventus.eventus.model.Usuario;

import java.time.LocalDate;

/** Nunca inclui a senha. */
public record UsuarioResponse(Long id, String nome, String email, String telefone, String cpf,
                              LocalDate dataNascimento, EnderecoDto endereco, boolean operador) {

    public static UsuarioResponse de(Usuario u, boolean operador) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getTelefone(), u.getCpf(),
                u.getDataNascimento(), EnderecoDto.de(u.getEndereco()), operador);
    }
}
