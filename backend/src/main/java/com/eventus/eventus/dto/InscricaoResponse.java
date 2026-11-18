package com.eventus.eventus.dto;

import com.eventus.eventus.model.Evento;
import com.eventus.eventus.model.Inscricao;

import java.time.LocalDateTime;

public record InscricaoResponse(Long id, String codigo, LocalDateTime dataInscricao, boolean presente,
                                EventoResumo evento) {

    /** Dados básicos do evento mostrados junto da inscrição. */
    public record EventoResumo(Long id, String titulo, LocalDateTime data, String local) {

        static EventoResumo de(Evento e) {
            return new EventoResumo(e.getId(), e.getTitulo(), e.getData(), e.getLocal());
        }
    }

    public static InscricaoResponse de(Inscricao i) {
        return new InscricaoResponse(i.getId(), i.getCodigo(), i.getDataInscricao(), i.isPresente(),
                EventoResumo.de(i.getEvento()));
    }
}
