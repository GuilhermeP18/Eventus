package com.eventus.eventus.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    public record Identidade(String email, Long usuarioId) {
    }

    private final SecretKey chave;
    private final Duration validade;
    private final Clock clock;

    public JwtService(@Value("${app.jwt.secret}") String segredo,
                      @Value("${app.jwt.expiration-minutes}") long minutos,
                      Clock clock) {
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.validade = Duration.ofMinutes(minutos);
        this.clock = clock;
    }

    public String gerar(String email, Long usuarioId) {
        Instant agora = clock.instant();
        return Jwts.builder()
                .subject(email)
                .claim("uid", usuarioId)
                .issuedAt(Date.from(agora))
                .expiration(Date.from(agora.plus(validade)))
                .signWith(chave)
                .compact();
    }

    /** Devolve o e-mail do token, ou vazio se o token for inválido ou expirado. */
    public Optional<String> extrairEmail(String token) {
        return extrairIdentidade(token).map(Identidade::email);
    }

    public Optional<Identidade> extrairIdentidade(String token) {
        try {
            var claims = Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload();
            String email = claims.getSubject();
            if (email == null) {
                return Optional.empty();
            }
            Object id = claims.get("uid");
            Long usuarioId = id instanceof Number number ? number.longValue() : null;
            return Optional.of(new Identidade(email, usuarioId));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
