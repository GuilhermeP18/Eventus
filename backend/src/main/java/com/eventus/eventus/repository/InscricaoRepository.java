package com.eventus.eventus.repository;

import com.eventus.eventus.model.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long> {

    Optional<Inscricao> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Inscricao> findByUsuarioIdOrderByDataInscricaoDesc(Long usuarioId);

    Optional<Inscricao> findByEventoIdAndUsuarioId(Long eventoId, Long usuarioId);

    boolean existsByEventoIdAndUsuarioId(Long eventoId, Long usuarioId);

    long countByEventoId(Long eventoId);
}
