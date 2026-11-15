package com.eventus.eventus.service;

import com.eventus.eventus.dto.EventoRequest;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.repository.EventoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    private static EventoRequest evento(LocalDateTime inscricaoInicio, LocalDateTime inscricaoFim) {
        return new EventoRequest("Feira de Ciências", "Descrição", LocalDateTime.of(2027, 1, 20, 9, 0),
                "Ginásio", 100, inscricaoInicio, inscricaoFim);
    }
}
