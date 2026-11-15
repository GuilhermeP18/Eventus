package com.eventus.eventus.controller;

import com.eventus.eventus.dto.DependenteRequest;
import com.eventus.eventus.dto.DependenteResponse;
import com.eventus.eventus.service.DependenteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dependentes")
public class DependenteController {

    private final DependenteService service;

    public DependenteController(DependenteService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DependenteResponse criar(Authentication auth, @Valid @RequestBody DependenteRequest req) {
        return service.criar(auth.getName(), req);
    }

    @GetMapping
    public List<DependenteResponse> listar(Authentication auth) {
        return service.listar(auth.getName());
    }
}
