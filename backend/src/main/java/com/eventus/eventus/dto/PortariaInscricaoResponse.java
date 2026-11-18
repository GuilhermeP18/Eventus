package com.eventus.eventus.dto;

import com.eventus.eventus.model.Inscricao;

import java.time.LocalDateTime;

/** Inscrição como a portaria enxerga: participante e evento resumidos. */
public record PortariaInscricaoResponse(Long id, String codigo, boolean presente, String nome, String cpf,
                                        String eventoTitulo, LocalDateTime eventoData) {

    public static PortariaInscricaoResponse de(Inscricao i) {
        return new PortariaInscricaoResponse(i.getId(), i.getCodigo(), i.isPresente(),
                i.getUsuario().getNome(), i.getUsuario().getCpf(),
                i.getEvento().getTitulo(), i.getEvento().getData());
    }
}
