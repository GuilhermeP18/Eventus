package com.eventus.eventus.service;

import com.eventus.eventus.RelogioMutavel;
import com.eventus.eventus.dto.CadastroRequest;
import com.eventus.eventus.dto.EnderecoDto;
import com.eventus.eventus.dto.LoginRequest;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.UsuarioRepository;
import com.eventus.eventus.security.JwtService;
import com.eventus.eventus.security.PortariaOperadores;
import com.eventus.eventus.security.TentativasLoginService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private static final String SENHA = "senha-correta-123";

    private final RelogioMutavel relogio = new RelogioMutavel(Instant.parse("2026-11-15T12:00:00Z"));
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private UsuarioRepository usuarios;
    private AuthService service;

    @BeforeEach
    void setUp() {
        usuarios = mock(UsuarioRepository.class);
        JwtService jwt = new JwtService("segredo-de-teste-com-mais-de-32-caracteres!!", 60, relogio);
        service = new AuthService(usuarios, encoder, jwt, new TentativasLoginService(relogio),
                new PortariaOperadores(""), relogio);
    }

    // ---------- idade mínima ----------

    @Test
    void cadastroRecusaMenorDe18Anos() {
        // faz 18 anos amanhã: ainda tem 17
        ApiException ex = assertThrows(ApiException.class,
                () -> service.cadastrar(cadastro(LocalDate.of(2008, 11, 16))));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(usuarios, never()).save(any());
    }

    @Test
    void cadastroAceitaQuemFaz18AnosHoje() {
        when(usuarios.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        var resposta = service.cadastrar(cadastro(LocalDate.of(2008, 11, 15)));

        assertEquals("maria@email.com", resposta.email());
        assertEquals("12345678901", resposta.cpf());
    }

    @Test
    void cadastroGuardaSenhaComHash() {
        when(usuarios.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        service.cadastrar(cadastro(LocalDate.of(1990, 1, 1)));

        var captor = org.mockito.ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(captor.capture());
        assertEquals(true, encoder.matches(SENHA, captor.getValue().getSenha()));
    }

    // ---------- bloqueio após 5 erros ----------

    @Test
    void loginBloqueiaAposCincoErrosPor15Minutos() {
        usuarioExistente();

        for (int i = 0; i < 5; i++) {
            ApiException ex = assertThrows(ApiException.class, () -> service.login(login("senha-errada")));
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
            assertEquals("E-mail ou senha incorretos", ex.getMessage());
        }

        // mesmo com a senha certa, continua bloqueado
        ApiException bloqueado = assertThrows(ApiException.class, () -> service.login(login(SENHA)));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, bloqueado.getStatus());

        relogio.avancar(Duration.ofMinutes(14));
        assertThrows(ApiException.class, () -> service.login(login(SENHA)));

        relogio.avancar(Duration.ofMinutes(2));
        assertNotNull(assertDoesNotThrow(() -> service.login(login(SENHA))).token());
    }

    @Test
    void loginComSucessoZeraContadorDeErros() {
        usuarioExistente();

        for (int i = 0; i < 4; i++) {
            assertThrows(ApiException.class, () -> service.login(login("senha-errada")));
        }
        assertDoesNotThrow(() -> service.login(login(SENHA)));

        // contador zerou: mais 4 erros não bloqueiam
        for (int i = 0; i < 4; i++) {
            ApiException ex = assertThrows(ApiException.class, () -> service.login(login("senha-errada")));
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        }
    }

    @Test
    void emailInexistenteTambemContaComoErro() {
        when(usuarios.findByEmail("fantasma@email.com")).thenReturn(Optional.empty());

        for (int i = 0; i < 5; i++) {
            assertThrows(ApiException.class, () -> service.login(new LoginRequest("fantasma@email.com", "x")));
        }
        ApiException ex = assertThrows(ApiException.class,
                () -> service.login(new LoginRequest("fantasma@email.com", "x")));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
    }

    // ---------- helpers ----------

    private void usuarioExistente() {
        Usuario u = new Usuario();
        u.setEmail("maria@email.com");
        u.setSenha(encoder.encode(SENHA));
        when(usuarios.findByEmail("maria@email.com")).thenReturn(Optional.of(u));
    }

    private static LoginRequest login(String senha) {
        return new LoginRequest("maria@email.com", senha);
    }

    private static CadastroRequest cadastro(LocalDate nascimento) {
        return new CadastroRequest("Maria", "Maria@Email.com", null, "123.456.789-01", nascimento, SENHA,
                new EnderecoDto("01001-000", "Praça da Sé", "1", null, "Sé", "São Paulo", "sp"));
    }
}
