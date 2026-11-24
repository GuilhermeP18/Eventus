package com.eventus.eventus.security;

import com.eventus.eventus.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lê o header "Authorization: Bearer ..." e, se o token for válido, autentica a requisição.
 * Token ausente ou inválido apenas deixa a requisição anônima (as regras de acesso decidem o resto).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;
    private final PortariaOperadores operadores;
    private final UsuarioRepository usuarios;

    public JwtAuthenticationFilter(JwtService jwtService, PortariaOperadores operadores, UsuarioRepository usuarios) {
        this.jwtService = jwtService;
        this.operadores = operadores;
        this.usuarios = usuarios;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(PREFIXO)) {
            jwtService.extrairIdentidade(header.substring(PREFIXO.length()).trim()).ifPresent(identidade -> {
                Long usuarioId = identidade.usuarioId();
                if (usuarioId == null) {
                    usuarioId = usuarios.findByEmail(identidade.email())
                            .map(usuario -> usuario.getId())
                            .orElse(null);
                }
                var authorities = operadores.isOperador(usuarioId)
                        ? List.of(new SimpleGrantedAuthority("ROLE_OPERADOR"))
                        : List.<SimpleGrantedAuthority>of();
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(identidade.email(), null, authorities));
            });
        }
        chain.doFilter(request, response);
    }
}
