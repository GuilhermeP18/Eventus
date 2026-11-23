package com.eventus.eventus.controller;

import com.eventus.eventus.dto.InscricaoResponse;
import com.eventus.eventus.service.InscricaoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class InscricaoController {

    private final InscricaoService service;

    public InscricaoController(InscricaoService service) {
        this.service = service;
    }

    @PostMapping("/eventos/{id}/inscricoes")
    @ResponseStatus(HttpStatus.CREATED)
    public InscricaoResponse inscrever(Authentication auth, @PathVariable Long id) {
        return service.inscrever(auth.getName(), id);
    }

    @GetMapping("/inscricoes/minhas")
    public List<InscricaoResponse> minhas(Authentication auth) {
        return service.minhas(auth.getName());
    }
}
