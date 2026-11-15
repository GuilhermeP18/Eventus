package com.eventus.eventus.service;

import com.eventus.eventus.dto.CadastroRequest;
import com.eventus.eventus.dto.LoginRequest;
import com.eventus.eventus.dto.TokenResponse;
import com.eventus.eventus.dto.UsuarioResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.UsuarioRepository;
import com.eventus.eventus.security.JwtService;
import com.eventus.eventus.security.TentativasLoginService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Period;

@Service
public class AuthService {

    static final int IDADE_MINIMA = 18;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final TentativasLoginService tentativas;
    private final Clock clock;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt,
                       TentativasLoginService tentativas, Clock clock) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
        this.tentativas = tentativas;
        this.clock = clock;
    }

    public UsuarioResponse cadastrar(CadastroRequest req) {
        int idade = Period.between(req.dataNascimento(), LocalDate.now(clock)).getYears();
        if (idade < IDADE_MINIMA) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "É necessário ter pelo menos 18 anos para se cadastrar");
        }

        String email = normalizarEmail(req.email());
        String cpf = req.cpf().replaceAll("\\D", "");
        if (usuarios.existsByEmail(email) || usuarios.existsByCpf(cpf)) {
            throw new ApiException(HttpStatus.CONFLICT, "E-mail ou CPF já cadastrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(req.nome().trim());
        usuario.setEmail(email);
        usuario.setCpf(cpf);
        usuario.setDataNascimento(req.dataNascimento());
        usuario.setSenha(encoder.encode(req.senha()));
        usuario.setEndereco(req.endereco().paraEntidade());
        return UsuarioResponse.de(usuarios.save(usuario));
    }

    public TokenResponse login(LoginRequest req) {
        String email = normalizarEmail(req.email());
        tentativas.verificarBloqueio(email);

        Usuario usuario = usuarios.findByEmail(email).orElse(null);
        if (usuario == null || !encoder.matches(req.senha(), usuario.getSenha())) {
            tentativas.registrarFalha(email);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos");
        }

        tentativas.registrarSucesso(email);
        return TokenResponse.bearer(jwt.gerar(usuario.getEmail()));
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }
}
