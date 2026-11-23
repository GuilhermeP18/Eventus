package com.eventus.eventus.service;

import com.eventus.eventus.dto.DependenteRequest;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Dependente;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.DependenteRepository;
import com.eventus.eventus.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DependenteServiceTest {

    private DependenteRepository dependentes;
    private UsuarioRepository usuarios;
    private DependenteService service;
    private Usuario responsavel;

    @BeforeEach
    void setUp() {
        dependentes = mock(DependenteRepository.class);
        usuarios = mock(UsuarioRepository.class);
        service = new DependenteService(dependentes, usuarios);

        responsavel = new Usuario();
        responsavel.setId(10L);
        responsavel.setEmail("ana@email.com");
        when(usuarios.findByEmail("ana@email.com")).thenReturn(Optional.of(responsavel));
    }

    @Test
    void criaDependenteComSucesso() {
        LocalDate nascimento = LocalDate.of(2016, 4, 12);
        when(dependentes.save(any(Dependente.class))).thenAnswer(inv -> {
            Dependente salvo = inv.getArgument(0);
            salvo.setId(1L);
            return salvo;
        });

        var resposta = service.criar("ana@email.com", new DependenteRequest("  Lucas Silva  ", nascimento));

        assertEquals(1L, resposta.id());
        assertEquals("Lucas Silva", resposta.nome());
        assertEquals(nascimento, resposta.dataNascimento());

        var captor = ArgumentCaptor.forClass(Dependente.class);
        verify(dependentes).save(captor.capture());
        assertEquals("Lucas Silva", captor.getValue().getNome());
        assertEquals(responsavel, captor.getValue().getResponsavel());
    }

    @Test
    void criarRecusaQuandoUsuarioDoTokenNaoExiste() {
        when(usuarios.findByEmail("removido@email.com")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.criar("removido@email.com",
                        new DependenteRequest("Lucas", LocalDate.of(2016, 4, 12))));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("Usuário do token não existe mais", ex.getMessage());
        verify(dependentes, never()).save(any());
    }

    @Test
    void listaDependentesDoResponsavel() {
        Dependente primeiro = dependente(1L, "Beatriz", LocalDate.of(2015, 2, 10));
        Dependente segundo = dependente(2L, "Pedro", LocalDate.of(2018, 9, 20));
        when(dependentes.findByResponsavelIdOrderByNome(10L)).thenReturn(List.of(primeiro, segundo));

        var lista = service.listar("ana@email.com");

        assertEquals(2, lista.size());
        assertEquals("Beatriz", lista.get(0).nome());
        assertEquals(LocalDate.of(2015, 2, 10), lista.get(0).dataNascimento());
        assertEquals("Pedro", lista.get(1).nome());
        verify(dependentes).findByResponsavelIdOrderByNome(10L);
    }

    @Test
    void listaVaziaQuandoNaoHaDependentes() {
        when(dependentes.findByResponsavelIdOrderByNome(10L)).thenReturn(List.of());

        var lista = service.listar("ana@email.com");

        assertTrue(lista.isEmpty());
    }

    @Test
    void listarRecusaQuandoUsuarioDoTokenNaoExiste() {
        when(usuarios.findByEmail("removido@email.com")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class, () -> service.listar("removido@email.com"));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        assertEquals("Usuário do token não existe mais", ex.getMessage());
        verify(dependentes, never()).findByResponsavelIdOrderByNome(any());
    }

    private Dependente dependente(Long id, String nome, LocalDate nascimento) {
        Dependente d = new Dependente();
        d.setId(id);
        d.setNome(nome);
        d.setDataNascimento(nascimento);
        d.setResponsavel(responsavel);
        return d;
    }
}
