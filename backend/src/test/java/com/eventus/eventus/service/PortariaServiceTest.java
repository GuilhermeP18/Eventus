package com.eventus.eventus.service;

import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Evento;
import com.eventus.eventus.model.Inscricao;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.InscricaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
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

class PortariaServiceTest {

    private InscricaoRepository inscricoes;
    private PortariaService service;
    private Inscricao inscricao;

    @BeforeEach
    void setUp() {
        inscricoes = mock(InscricaoRepository.class);
        service = new PortariaService(inscricoes);

        Usuario usuario = new Usuario();
        usuario.setNome("Ana Souza");
        usuario.setCpf("11122233344");
        Evento evento = new Evento();
        evento.setTitulo("Feira de Ciências");
        evento.setData(LocalDateTime.of(2027, 1, 20, 9, 0));
        inscricao = new Inscricao();
        inscricao.setId(5L);
        inscricao.setCodigo("AB12CD34");
        inscricao.setUsuario(usuario);
        inscricao.setEvento(evento);

        when(inscricoes.findById(5L)).thenReturn(Optional.of(inscricao));
        when(inscricoes.save(any(Inscricao.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void buscaPorCodigo() {
        when(inscricoes.buscarParaPortaria("AB12CD34", "")).thenReturn(List.of(inscricao));

        var r = service.buscar("  AB12CD34 ");

        assertEquals(1, r.size());
        assertEquals("AB12CD34", r.get(0).codigo());
        assertEquals("Ana Souza", r.get(0).nome());
        assertEquals("11122233344", r.get(0).cpf());
        assertEquals("Feira de Ciências", r.get(0).eventoTitulo());
        assertEquals(LocalDateTime.of(2027, 1, 20, 9, 0), r.get(0).eventoData());
        assertFalse(r.get(0).presente());
    }

    @Test
    void buscaPorNome() {
        when(inscricoes.buscarParaPortaria("ana", "")).thenReturn(List.of(inscricao));

        assertEquals(5L, service.buscar("ana").get(0).id());
    }

    @Test
    void buscaPorCpfComPontuacao() {
        when(inscricoes.buscarParaPortaria("111.222.333-44", "11122233344")).thenReturn(List.of(inscricao));

        assertEquals(5L, service.buscar("111.222.333-44").get(0).id());
    }

    @Test
    void buscaVaziaDa400() {
        for (String q : new String[]{null, "", "   "}) {
            ApiException ex = assertThrows(ApiException.class, () -> service.buscar(q));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        }
    }

    @Test
    void checkinMarcaPresente() {
        var r = service.registrarEntrada(5L);

        assertTrue(r.presente());
        assertTrue(inscricao.isPresente());
        verify(inscricoes).save(inscricao);
    }

    @Test
    void checkinRepetidoDa409() {
        inscricao.setPresente(true);

        ApiException ex = assertThrows(ApiException.class, () -> service.registrarEntrada(5L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Entrada já registrada", ex.getMessage());
        verify(inscricoes, never()).save(any());
    }

    @Test
    void inscricaoInexistenteDa404() {
        when(inscricoes.findById(99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.registrarEntrada(99L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }
}
