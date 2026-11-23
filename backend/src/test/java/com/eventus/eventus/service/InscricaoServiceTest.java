package com.eventus.eventus.service;

import com.eventus.eventus.RelogioMutavel;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.model.Inscricao;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.EventoRepository;
import com.eventus.eventus.repository.InscricaoRepository;
import com.eventus.eventus.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InscricaoServiceTest {

    /** "Agora" dos testes: 5/12/2026 12:00, dentro do período de inscrição do evento. */
    private static final Instant AGORA = Instant.parse("2026-12-05T12:00:00Z");

    private InscricaoRepository inscricoes;
    private EventoRepository eventos;
    private UsuarioRepository usuarios;
    private RelogioMutavel clock;
    private InscricaoService service;
    private Evento evento;

    @BeforeEach
    void setUp() {
        inscricoes = mock(InscricaoRepository.class);
        eventos = mock(EventoRepository.class);
        usuarios = mock(UsuarioRepository.class);
        clock = new RelogioMutavel(AGORA);
        service = new InscricaoService(inscricoes, eventos, usuarios, clock);

        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setEmail("ana@email.com");
        when(usuarios.findByEmail("ana@email.com")).thenReturn(Optional.of(usuario));

        evento = new Evento();
        evento.setId(1L);
        evento.setTitulo("Feira de Ciências");
        evento.setData(LocalDateTime.of(2027, 1, 20, 9, 0));
        evento.setLocal("Ginásio");
        evento.setCapacidade(2);
        evento.setInscricaoInicio(LocalDateTime.of(2026, 12, 1, 8, 0));
        evento.setInscricaoFim(LocalDateTime.of(2026, 12, 10, 8, 0));
        when(eventos.findById(1L)).thenReturn(Optional.of(evento));

        when(inscricoes.save(any(Inscricao.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void inscreveComSucesso() {
        var resposta = service.inscrever("ana@email.com", 1L);

        assertEquals(8, resposta.codigo().length());
        assertTrue(resposta.codigo().matches("[A-Z0-9]{8}"));
        assertEquals(LocalDateTime.of(2026, 12, 5, 12, 0), resposta.dataInscricao());
        assertFalse(resposta.presente());
        assertEquals(1L, resposta.evento().id());
        assertEquals("Feira de Ciências", resposta.evento().titulo());
        verify(inscricoes).save(any(Inscricao.class));
    }

    @Test
    void recusaInscricaoDuplicada() {
        when(inscricoes.existsByEventoIdAndUsuarioId(1L, 7L)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> service.inscrever("ana@email.com", 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(inscricoes, never()).save(any());
    }

    @Test
    void recusaQuandoNaoHaVagas() {
        when(inscricoes.countByEventoId(1L)).thenReturn(2L);

        ApiException ex = assertThrows(ApiException.class, () -> service.inscrever("ana@email.com", 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(inscricoes, never()).save(any());
    }

    @Test
    void aceitaQuandoAindaRestaUmaVaga() {
        when(inscricoes.countByEventoId(1L)).thenReturn(1L);

        assertEquals(1L, service.inscrever("ana@email.com", 1L).evento().id());
    }

    @Test
    void recusaAntesDoInicioDaInscricao() {
        clock.avancar(Duration.ofDays(-10)); // 25/11

        ApiException ex = assertThrows(ApiException.class, () -> service.inscrever("ana@email.com", 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(inscricoes, never()).save(any());
    }

    @Test
    void recusaDepoisDoFimDaInscricao() {
        clock.avancar(Duration.ofDays(6)); // 11/12

        ApiException ex = assertThrows(ApiException.class, () -> service.inscrever("ana@email.com", 1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(inscricoes, never()).save(any());
    }

    @Test
    void eventoInexistenteDa404() {
        when(eventos.findById(99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.inscrever("ana@email.com", 99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("Evento não encontrado", ex.getMessage());
    }
}
