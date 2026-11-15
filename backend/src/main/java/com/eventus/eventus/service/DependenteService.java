package com.eventus.eventus.service;

import com.eventus.eventus.dto.DependenteRequest;
import com.eventus.eventus.dto.DependenteResponse;
import com.eventus.eventus.exception.ApiException;
import com.eventus.eventus.model.Dependente;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.DependenteRepository;
import com.eventus.eventus.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DependenteService {

    private final DependenteRepository dependentes;
    private final UsuarioRepository usuarios;

    public DependenteService(DependenteRepository dependentes, UsuarioRepository usuarios) {
        this.dependentes = dependentes;
        this.usuarios = usuarios;
    }

    public DependenteResponse criar(String emailResponsavel, DependenteRequest req) {
        Dependente dependente = new Dependente();
        dependente.setNome(req.nome().trim());
        dependente.setDataNascimento(req.dataNascimento());
        dependente.setResponsavel(buscarUsuario(emailResponsavel));
        return DependenteResponse.de(dependentes.save(dependente));
    }

    public List<DependenteResponse> listar(String emailResponsavel) {
        Usuario responsavel = buscarUsuario(emailResponsavel);
        return dependentes.findByResponsavelIdOrderByNome(responsavel.getId()).stream()
                .map(DependenteResponse::de)
                .toList();
    }

    private Usuario buscarUsuario(String email) {
        return usuarios.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuário do token não existe mais"));
    }
}
