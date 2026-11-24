package com.eventus.eventus.controller;

import com.eventus.eventus.dto.EventoRequest;
import com.eventus.eventus.dto.EventoResponse;
import com.eventus.eventus.service.EventoService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/eventos")
public class EventoController {

    private final EventoService service;

    public EventoController(EventoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventoResponse criar(Authentication auth, @Valid @RequestBody EventoRequest req) {
        return service.criar(auth.getName(), req);
    }

    @GetMapping
    public List<EventoResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public EventoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public EventoResponse atualizar(Authentication auth, @PathVariable Long id, @Valid @RequestBody EventoRequest req) {
        return service.atualizar(id, auth.getName(), req);
    }

    @PutMapping("/{id}/imagem")
    public EventoResponse enviarImagem(Authentication auth, @PathVariable Long id,
                                       @RequestParam("arquivo") MultipartFile arquivo)
            throws IOException {
        return service.salvarImagem(id, auth.getName(), arquivo);
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<byte[]> imagem(@PathVariable Long id) {
        EventoService.Imagem imagem = service.buscarImagem(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imagem.tipo()))
                .cacheControl(CacheControl.noCache()) // sempre revalida: a imagem pode ser trocada
                .body(imagem.bytes());
    }
}
