package com.eventus.eventus.security;

import com.eventus.eventus.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Controla falhas de login por e-mail: 5 erros seguidos bloqueiam o login por 15 minutos.
 * O estado fica em memória (é zerado ao reiniciar a aplicação).
 */
@Service
public class TentativasLoginService {

    static final int MAX_FALHAS = 5;
    static final Duration BLOQUEIO = Duration.ofMinutes(15);

    private static class Estado {
        int falhas;
        Instant bloqueadoAte;
    }

    private final Map<String, Estado> estados = new HashMap<>();
    private final Clock clock;

    public TentativasLoginService(Clock clock) {
        this.clock = clock;
    }

    /** Lança 429 se o e-mail estiver bloqueado. */
    public synchronized void verificarBloqueio(String email) {
        Estado estado = estados.get(email);
        if (estado == null || estado.bloqueadoAte == null) {
            return;
        }
        Instant agora = clock.instant();
        if (agora.isBefore(estado.bloqueadoAte)) {
            long minutos = Duration.between(agora, estado.bloqueadoAte).toMinutes() + 1;
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas tentativas de login. Tente novamente em " + minutos + " minuto(s)");
        }
        estados.remove(email); // bloqueio expirou
    }

    public synchronized void registrarFalha(String email) {
        Estado estado = estados.computeIfAbsent(email, k -> new Estado());
        estado.falhas++;
        if (estado.falhas >= MAX_FALHAS) {
            estado.bloqueadoAte = clock.instant().plus(BLOQUEIO);
        }
    }

    public synchronized void registrarSucesso(String email) {
        estados.remove(email);
    }
}
