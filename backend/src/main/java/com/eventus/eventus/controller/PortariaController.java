package com.eventus.eventus.controller;

import com.eventus.eventus.dto.PortariaInscricaoResponse;
import com.eventus.eventus.service.PortariaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portaria")
public class PortariaController {

    private final PortariaService service;

    public PortariaController(PortariaService service) {
        this.service = service;
    }

    @GetMapping("/busca")
    public List<PortariaInscricaoResponse> buscar(@RequestParam(name = "q", defaultValue = "") String q) {
        return service.buscar(q);
    }

    @PostMapping("/inscricoes/{id}/checkin")
    public PortariaInscricaoResponse checkin(@PathVariable Long id) {
        return service.registrarEntrada(id);
    }
}
