package com.eventus.eventus.service;

import com.eventus.eventus.dto.EventoRequest;
import com.eventus.eventus.dto.EventoResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.repository.EventoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventoService {

    private final EventoRepository eventos;

    public EventoService(EventoRepository eventos) {
        this.eventos = eventos;
    }

    public EventoResponse criar(EventoRequest req) {
        if (!req.inscricaoFim().isAfter(req.inscricaoInicio())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "O fim da inscrição deve ser depois do início da inscrição");
        }

        Evento evento = new Evento();
        evento.setTitulo(req.titulo().trim());
        evento.setDescricao(req.descricao());
        evento.setData(req.data());
        evento.setLocal(req.local().trim());
        evento.setCapacidade(req.capacidade());
        evento.setInscricaoInicio(req.inscricaoInicio());
        evento.setInscricaoFim(req.inscricaoFim());
        return EventoResponse.de(eventos.save(evento));
    }

    public List<EventoResponse> listar() {
        return eventos.findAllByOrderByDataAsc().stream().map(EventoResponse::de).toList();
    }

    public EventoResponse buscar(Long id) {
        return eventos.findById(id)
                .map(EventoResponse::de)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado"));
    }
}
