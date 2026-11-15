package com.eventus.eventus.service;

import com.eventus.eventus.dto.EventoRequest;
import com.eventus.eventus.dto.EventoResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.repository.EventoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
public class EventoService {

    public record Imagem(byte[] bytes, String tipo) {
    }

    private static final Set<String> TIPOS_IMAGEM = Set.of("image/jpeg", "image/png", "image/webp");

    private final EventoRepository eventos;

    public EventoService(EventoRepository eventos) {
        this.eventos = eventos;
    }

    public EventoResponse criar(EventoRequest req) {
        validarDatas(req);
        Evento evento = new Evento();
        preencher(evento, req);
        return EventoResponse.de(eventos.save(evento));
    }

    /** Atualiza os dados do evento. A imagem não muda aqui: só por {@link #salvarImagem}. */
    public EventoResponse atualizar(Long id, EventoRequest req) {
        Evento evento = buscarEvento(id);
        validarDatas(req);
        preencher(evento, req);
        return EventoResponse.de(eventos.save(evento));
    }

    public List<EventoResponse> listar() {
        return eventos.findAllByOrderByDataAsc().stream().map(EventoResponse::de).toList();
    }

    public EventoResponse buscar(Long id) {
        return EventoResponse.de(buscarEvento(id));
    }

    public EventoResponse salvarImagem(Long id, MultipartFile arquivo) throws IOException {
        Evento evento = buscarEvento(id);
        if (arquivo.isEmpty() || !TIPOS_IMAGEM.contains(arquivo.getContentType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Formato de imagem não permitido. Use JPG, PNG ou WEBP.");
        }
        evento.setImagem(arquivo.getBytes());
        evento.setImagemTipo(arquivo.getContentType());
        return EventoResponse.de(eventos.save(evento));
    }

    public Imagem buscarImagem(Long id) {
        Evento evento = buscarEvento(id);
        if (evento.getImagem() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Imagem não encontrada");
        }
        return new Imagem(evento.getImagem(), evento.getImagemTipo());
    }

    private static void validarDatas(EventoRequest req) {
        if (!req.inscricaoFim().isAfter(req.inscricaoInicio())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "O fim da inscrição deve ser depois do início da inscrição");
        }
    }

    private static void preencher(Evento evento, EventoRequest req) {
        evento.setTitulo(req.titulo().trim());
        evento.setDescricao(req.descricao());
        evento.setData(req.data());
        evento.setLocal(req.local().trim());
        evento.setCapacidade(req.capacidade());
        evento.setInscricaoInicio(req.inscricaoInicio());
        evento.setInscricaoFim(req.inscricaoFim());
    }

    private Evento buscarEvento(Long id) {
        return eventos.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado"));
    }
}
