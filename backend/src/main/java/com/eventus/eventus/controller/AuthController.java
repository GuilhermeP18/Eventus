package com.eventus.eventus.controller;

import com.eventus.eventus.dto.AtualizarPerfilRequest;
import com.eventus.eventus.dto.CadastroRequest;
import com.eventus.eventus.dto.LoginRequest;
import com.eventus.eventus.dto.TokenResponse;
import com.eventus.eventus.dto.UsuarioResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse cadastrar(@Valid @RequestBody CadastroRequest req) {
        return authService.cadastrar(req);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication auth) {
        return authService.perfil(emailLogado(auth));
    }

    @PutMapping("/me")
    public UsuarioResponse atualizarMe(Authentication auth, @Valid @RequestBody AtualizarPerfilRequest req) {
        return authService.atualizarPerfil(emailLogado(auth), req);
    }

    /**
     * "/auth/**" é público na SecurityConfig, então a regra de login de /me é conferida aqui.
     * (Quando a SecurityConfig for revisada, /me deve passar a exigir login por lá.)
     */
    private static String emailLogado(Authentication auth) {
        if (auth == null || auth instanceof AnonymousAuthenticationToken || !auth.isAuthenticated()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Autenticação necessária");
        }
        return auth.getName();
    }
}
