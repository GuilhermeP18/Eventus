package com.eventus.eventus;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Relógio controlável para testar regras que dependem de tempo. */
public class RelogioMutavel extends Clock {

    private Instant agora;

    public RelogioMutavel(Instant inicio) {
        this.agora = inicio;
    }

    public void avancar(Duration duracao) {
        agora = agora.plus(duracao);
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return this;
    }

    @Override
    public Instant instant() {
        return agora;
    }
}
