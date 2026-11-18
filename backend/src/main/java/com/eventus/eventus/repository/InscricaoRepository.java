package com.eventus.eventus.repository;

import com.eventus.eventus.model.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long> {

    Optional<Inscricao> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Inscricao> findByUsuarioIdOrderByDataInscricaoDesc(Long usuarioId);

    Optional<Inscricao> findByEventoIdAndUsuarioId(Long eventoId, Long usuarioId);

    boolean existsByEventoIdAndUsuarioId(Long eventoId, Long usuarioId);

    long countByEventoId(Long eventoId);

    /** Busca da portaria: código exato, CPF exato (só dígitos) ou parte do nome. */
    @Query("""
            select i from Inscricao i join fetch i.usuario u join fetch i.evento
            where upper(i.codigo) = upper(:termo)
               or u.cpf = :cpf
               or lower(u.nome) like lower(concat('%', :termo, '%'))
            order by u.nome, i.id
            """)
    List<Inscricao> buscarParaPortaria(@Param("termo") String termo, @Param("cpf") String cpf);
}
