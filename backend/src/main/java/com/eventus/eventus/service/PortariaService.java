package com.eventus.eventus.service;

import com.eventus.eventus.dto.PortariaInscricaoResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Inscricao;
import com.eventus.eventus.repository.InscricaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PortariaService {

    private final InscricaoRepository inscricoes;

    public PortariaService(InscricaoRepository inscricoes) {
        this.inscricoes = inscricoes;
    }

    /** Procura por código da inscrição, nome do participante ou CPF (com ou sem pontuação). */
    @Transactional(readOnly = true)
    public List<PortariaInscricaoResponse> buscar(String q) {
        String termo = q == null ? "" : q.trim();
        if (termo.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um código, nome ou CPF para buscar");
        }
        String digitos = termo.replaceAll("\\D", "");
        String cpf = digitos.length() == 11 ? digitos : "";
        return inscricoes.buscarParaPortaria(termo, cpf).stream().map(PortariaInscricaoResponse::de).toList();
    }

    @Transactional
    public PortariaInscricaoResponse registrarEntrada(Long id) {
        Inscricao inscricao = inscricoes.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Inscrição não encontrada"));
        if (inscricao.isPresente()) {
            throw new ApiException(HttpStatus.CONFLICT, "Entrada já registrada");
        }
        inscricao.setPresente(true);
        return PortariaInscricaoResponse.de(inscricoes.save(inscricao));
    }
}
