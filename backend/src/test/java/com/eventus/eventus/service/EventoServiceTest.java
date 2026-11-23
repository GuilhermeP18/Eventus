package com.eventus.eventus.service;

import com.eventus.eventus.dto.EventoRequest;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.repository.EventoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventoServiceTest {

    private static final LocalDateTime INICIO = LocalDateTime.of(2026, 12, 1, 8, 0);

    private EventoRepository eventos;
    private EventoService service;

    @BeforeEach
    void setUp() {
        eventos = mock(EventoRepository.class);
        service = new EventoService(eventos);
    }

    @Test
    void recusaFimDeInscricaoAntesDoInicio() {
        ApiException ex = assertThrows(ApiException.class,
                () -> service.criar(evento(INICIO, INICIO.minusDays(1))));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(eventos, never()).save(any());
    }

    @Test
    void recusaFimDeInscricaoIgualAoInicio() {
        assertThrows(ApiException.class, () -> service.criar(evento(INICIO, INICIO)));
        verify(eventos, never()).save(any());
    }

    @Test
    void criaEventoComDatasValidas() {
        when(eventos.save(any(Evento.class))).thenAnswer(i -> i.getArgument(0));

        var resposta = service.criar(evento(INICIO, INICIO.plusDays(10)));

        assertEquals("Feira de Ciências", resposta.titulo());
    }

    @Test
    void uploadDeTipoInvalidoERecusado() {
        eventoExistente();
        var gif = new MockMultipartFile("arquivo", "capa.gif", "image/gif", new byte[]{1, 2, 3});

        ApiException ex = assertThrows(ApiException.class, () -> service.salvarImagem(1L, gif));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Formato de imagem não permitido. Use JPG, PNG ou WEBP.", ex.getMessage());
        verify(eventos, never()).save(any());
    }

    @Test
    void uploadValidoApareceNaRespostaDoEvento() throws Exception {
        eventoExistente();
        when(eventos.save(any(Evento.class))).thenAnswer(i -> i.getArgument(0));
        var png = new MockMultipartFile("arquivo", "capa.png", "image/png", new byte[]{1, 2, 3});

        var resposta = service.salvarImagem(1L, png);

        assertEquals("/api/v1/eventos/1/imagem", resposta.imagemUrl());
        assertEquals("image/png", service.buscarImagem(1L).tipo());
    }

    @Test
    void imagemUrlEhNulaQuandoNaoHaImagem() {
        eventoExistente();

        assertNull(service.buscar(1L).imagemUrl());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ApiException.class, () -> service.buscarImagem(1L)).getStatus());
    }

    @Test
    void uploadEmEventoInexistenteDa404() {
        when(eventos.findById(99L)).thenReturn(Optional.empty());
        var png = new MockMultipartFile("arquivo", "capa.png", "image/png", new byte[]{1});

        ApiException ex = assertThrows(ApiException.class, () -> service.salvarImagem(99L, png));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void atualizaTituloEDatas() {
        Evento existente = eventoExistente();
        when(eventos.save(any(Evento.class))).thenAnswer(i -> i.getArgument(0));
        var novo = new EventoRequest("Novo título", "Outra descrição", LocalDateTime.of(2027, 3, 1, 10, 0),
                "Auditório", 200, INICIO.plusDays(1), INICIO.plusDays(20));

        var resposta = service.atualizar(1L, novo);

        assertEquals("Novo título", resposta.titulo());
        assertEquals(LocalDateTime.of(2027, 3, 1, 10, 0), resposta.data());
        assertEquals(INICIO.plusDays(20), existente.getInscricaoFim());
    }

    @Test
    void atualizacaoRecusaFimDeInscricaoAntesDoInicio() {
        eventoExistente();

        ApiException ex = assertThrows(ApiException.class,
                () -> service.atualizar(1L, evento(INICIO, INICIO.minusDays(1))));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(eventos, never()).save(any());
    }

    @Test
    void atualizacaoMantemAImagem() {
        Evento existente = eventoExistente();
        existente.setImagem(new byte[]{9, 9});
        existente.setImagemTipo("image/png");
        when(eventos.save(any(Evento.class))).thenAnswer(i -> i.getArgument(0));

        var resposta = service.atualizar(1L, evento(INICIO, INICIO.plusDays(10)));

        assertEquals("/api/v1/eventos/1/imagem", resposta.imagemUrl());
        assertEquals("image/png", service.buscarImagem(1L).tipo());
        assertEquals(2, service.buscarImagem(1L).bytes().length);
    }

    @Test
    void atualizacaoDeEventoInexistenteDa404() {
        when(eventos.findById(99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.atualizar(99L, evento(INICIO, INICIO.plusDays(10))));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    /** Evento 1 sem imagem; save e findById passam a devolver o mesmo objeto. */
    private Evento eventoExistente() {
        Evento evento = new Evento();
        evento.setId(1L);
        when(eventos.findById(1L)).thenReturn(Optional.of(evento));
        return evento;
    }

    private static EventoRequest evento(LocalDateTime inscricaoInicio, LocalDateTime inscricaoFim) {
        return new EventoRequest("Feira de Ciências", "Descrição", LocalDateTime.of(2027, 1, 20, 9, 0),
                "Ginásio", 100, inscricaoInicio, inscricaoFim);
    }
}
