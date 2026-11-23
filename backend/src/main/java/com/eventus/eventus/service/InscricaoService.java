package com.eventus.eventus.service;

import com.eventus.eventus.dto.InscricaoResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.model.Inscricao;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.EventoRepository;
import com.eventus.eventus.repository.InscricaoRepository;
import com.eventus.eventus.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InscricaoService {

    private static final String ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int TAMANHO_CODIGO = 8;

    private final InscricaoRepository inscricoes;
    private final EventoRepository eventos;
    private final UsuarioRepository usuarios;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public InscricaoService(InscricaoRepository inscricoes, EventoRepository eventos,
                            UsuarioRepository usuarios, Clock clock) {
        this.inscricoes = inscricoes;
        this.eventos = eventos;
        this.usuarios = usuarios;
        this.clock = clock;
    }

    @Transactional
    public InscricaoResponse inscrever(String emailUsuario, Long eventoId) {
        Usuario usuario = buscarUsuario(emailUsuario);
        Evento evento = eventos.findById(eventoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evento não encontrado"));

        if (inscricoes.existsByEventoIdAndUsuarioId(evento.getId(), usuario.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Você já está inscrito neste evento");
        }

        LocalDateTime agora = LocalDateTime.now(clock);
        if (agora.isBefore(evento.getInscricaoInicio()) || agora.isAfter(evento.getInscricaoFim())) {
            throw new ApiException(HttpStatus.CONFLICT, "Fora do período de inscrição deste evento");
        }

        if (inscricoes.countByEventoId(evento.getId()) >= evento.getCapacidade()) {
            throw new ApiException(HttpStatus.CONFLICT, "Evento sem vagas disponíveis");
        }

        Inscricao inscricao = new Inscricao();
        inscricao.setUsuario(usuario);
        inscricao.setEvento(evento);
        inscricao.setCodigo(gerarCodigo());
        inscricao.setDataInscricao(agora);
        return InscricaoResponse.de(inscricoes.save(inscricao));
    }

    @Transactional(readOnly = true)
    public List<InscricaoResponse> minhas(String emailUsuario) {
        Usuario usuario = buscarUsuario(emailUsuario);
        return inscricoes.findByUsuarioIdOrderByDataInscricaoDesc(usuario.getId()).stream()
                .map(InscricaoResponse::de)
                .toList();
    }

    private String gerarCodigo() {
        String codigo;
        do {
            StringBuilder sb = new StringBuilder(TAMANHO_CODIGO);
            for (int i = 0; i < TAMANHO_CODIGO; i++) {
                sb.append(ALFABETO.charAt(random.nextInt(ALFABETO.length())));
            }
            codigo = sb.toString();
        } while (inscricoes.existsByCodigo(codigo));
        return codigo;
    }

    private Usuario buscarUsuario(String email) {
        return usuarios.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuário do token não existe mais"));
    }
}
