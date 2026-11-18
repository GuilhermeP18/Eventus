package com.eventus.eventus.repository;

import com.eventus.eventus.model.Dependente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DependenteRepository extends JpaRepository<Dependente, Long> {

    List<Dependente> findByResponsavelIdOrderByNome(Long responsavelId);
}
