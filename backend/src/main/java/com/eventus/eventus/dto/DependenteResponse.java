package com.eventus.eventus.dto;

import com.eventus.eventus.model.Dependente;

import java.time.LocalDate;

public record DependenteResponse(Long id, String nome, LocalDate dataNascimento) {

    public static DependenteResponse de(Dependente d) {
        return new DependenteResponse(d.getId(), d.getNome(), d.getDataNascimento());
    }
}
