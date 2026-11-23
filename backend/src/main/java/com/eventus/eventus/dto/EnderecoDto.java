package com.eventus.eventus.dto;

import com.eventus.eventus.model.Endereco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoDto(
        @NotBlank @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP inválido") String cep,
        @NotBlank @Size(max = 150) String rua,
        @NotBlank @Size(max = 20) String numero,
        @Size(max = 100) String complemento,
        @NotBlank @Size(max = 100) String bairro,
        @NotBlank @Size(max = 100) String cidade,
        @NotBlank @Pattern(regexp = "[A-Za-z]{2}", message = "UF deve ter 2 letras") String uf) {

    public Endereco paraEntidade() {
        String comp = complemento == null || complemento.isBlank() ? null : complemento.trim();
        return new Endereco(cep.replaceAll("\\D", ""), rua.trim(), numero.trim(), comp,
                bairro.trim(), cidade.trim(), uf.toUpperCase());
    }

    public static EnderecoDto de(Endereco e) {
        return new EnderecoDto(e.getCep(), e.getRua(), e.getNumero(), e.getComplemento(),
                e.getBairro(), e.getCidade(), e.getUf());
    }
}
