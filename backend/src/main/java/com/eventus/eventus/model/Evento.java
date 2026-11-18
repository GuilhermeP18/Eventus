package com.eventus.eventus.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "eventos")
@Getter
@Setter
@NoArgsConstructor
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 2000)
    private String descricao;

    @Column(name = "data_evento", nullable = false)
    private LocalDateTime data;

    @Column(name = "local_evento", nullable = false)
    private String local;

    @Column(nullable = false)
    private Integer capacidade;

    @Column(nullable = false)
    private LocalDateTime inscricaoInicio;

    @Column(nullable = false)
    private LocalDateTime inscricaoFim;

    /** Imagem de capa (opcional), guardada no banco. */
    // "binary large object" é o nome padrão do BLOB; o H2 em MODE=PostgreSQL não aceita o nome "blob".
    @Lob
    @Column(columnDefinition = "binary large object")
    private byte[] imagem;

    /** Tipo da imagem, ex.: "image/png". */
    private String imagemTipo;
}
