package com.eventus.eventus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Teste de ponta a ponta da segurança e dos endpoints, com H2 em memória. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiFluxoTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper mapper;

    private static final String CADASTRO = """
            {"nome":"Ana","email":"%s","cpf":"%s","dataNascimento":"1990-05-10","senha":"senha12345",
             "endereco":{"cep":"01001-000","rua":"Praça da Sé","numero":"1","bairro":"Sé","cidade":"São Paulo","uf":"SP"}}
            """;

    private static final String EVENTO = """
            {"titulo":"Feira","descricao":"d","data":"2027-01-20T09:00:00","local":"Ginásio","capacidade":50,
             "inscricaoInicio":"2026-12-01T08:00:00","inscricaoFim":"%s"}
            """;

    @Test
    void fluxoCompleto() throws Exception {
        // cadastro não devolve a senha
        enviar("/api/v1/auth/cadastro", String.format(CADASTRO, "ana@email.com", "11111111111"), null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.endereco.cidade").value("São Paulo"));

        // e-mail e CPF duplicados -> 409
        enviar("/api/v1/auth/cadastro", String.format(CADASTRO, "ana@email.com", "22222222222"), null)
                .andExpect(status().isConflict());
        enviar("/api/v1/auth/cadastro", String.format(CADASTRO, "outra@email.com", "11111111111"), null)
                .andExpect(status().isConflict());

        // validação -> 400 com campos
        enviar("/api/v1/auth/cadastro", "{\"nome\":\"\",\"email\":\"x\"}", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());

        // login errado -> 401 com a mensagem padrão
        enviar("/api/v1/auth/login", "{\"email\":\"ana@email.com\",\"senha\":\"errada\"}", null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("E-mail ou senha incorretos"));

        String token = token("ana@email.com");

        // rotas protegidas sem token -> 401; com token -> ok
        mvc.perform(get("/api/v1/dependentes")).andExpect(status().isUnauthorized());
        enviar("/api/v1/dependentes", "{\"nome\":\"Filho\",\"dataNascimento\":\"2015-03-01\"}", token)
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/dependentes").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // outro usuário não vê os dependentes da Ana
        enviar("/api/v1/auth/cadastro", String.format(CADASTRO, "bia@email.com", "33333333333"), null)
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/dependentes").header("Authorization", "Bearer " + token("bia@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // eventos: criar exige login, datas inválidas -> 400, leitura é pública
        enviar("/api/v1/eventos", String.format(EVENTO, "2026-12-10T08:00:00"), null)
                .andExpect(status().isUnauthorized());
        enviar("/api/v1/eventos", String.format(EVENTO, "2026-11-01T08:00:00"), token)
                .andExpect(status().isBadRequest());
        enviar("/api/v1/eventos", String.format(EVENTO, "2026-12-10T08:00:00"), token)
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/eventos")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/eventos/999")).andExpect(status().isNotFound());
    }

    private String token(String email) throws Exception {
        String corpo = enviar("/api/v1/auth/login",
                "{\"email\":\"" + email + "\",\"senha\":\"senha12345\"}", null)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = mapper.readTree(corpo);
        return json.get("token").asText();
    }

    private ResultActions enviar(String url, String json, String token) throws Exception {
        var req = post(url).contentType(MediaType.APPLICATION_JSON).content(json);
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }
        return mvc.perform(req);
    }
}
