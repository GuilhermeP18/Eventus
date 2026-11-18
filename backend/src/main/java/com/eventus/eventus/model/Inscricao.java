package com.eventus.eventus.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "inscricoes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "evento_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    /** Código único da inscrição (8 caracteres alfanuméricos), gerado pelo sistema. */
    @Column(nullable = false, unique = true, length = 8)
    private String codigo;

    @Column(nullable = false)
    private LocalDateTime dataInscricao;

    /** Marcada na portaria quando a pessoa chega ao evento. */
    @Column(nullable = false)
    private boolean presente = false;
}
