package com.eventus.eventus.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class PortariaOperadores {

    private final Set<Long> usuarioIds;

    public PortariaOperadores(@Value("${app.portaria.operator-ids:}") String ids) {
        this.usuarioIds = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .map(Long::valueOf)
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isOperador(Long usuarioId) {
        return usuarioId != null && usuarioIds.contains(usuarioId);
    }
}
