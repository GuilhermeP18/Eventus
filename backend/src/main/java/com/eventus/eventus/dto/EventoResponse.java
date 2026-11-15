package com.eventus.eventus.dto;

import com.eventus.eventus.model.Evento;

import java.time.LocalDateTime;

public record EventoResponse(Long id, String titulo, String descricao, LocalDateTime data, String local,
                             Integer capacidade, LocalDateTime inscricaoInicio, LocalDateTime inscricaoFim,
                             String imagemUrl) {

    public static EventoResponse de(Evento e) {
        String imagemUrl = e.getImagem() == null ? null : "/api/v1/eventos/" + e.getId() + "/imagem";
        return new EventoResponse(e.getId(), e.getTitulo(), e.getDescricao(), e.getData(), e.getLocal(),
                e.getCapacidade(), e.getInscricaoInicio(), e.getInscricaoFim(), imagemUrl);
    }
}
