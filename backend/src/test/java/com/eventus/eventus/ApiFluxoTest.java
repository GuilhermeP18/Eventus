package com.eventus.eventus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
        String criado = enviar("/api/v1/eventos", String.format(EVENTO, "2026-12-10T08:00:00"), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imagemUrl").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long eventoId = mapper.readTree(criado).get("id").asLong();

        // edição: exige login, valida datas e altera o título sem perder a imagem
        String urlEvento = "/api/v1/eventos/" + eventoId;
        String edicao = String.format(EVENTO, "2026-12-10T08:00:00").replace("Feira", "Feira Editada");
        put(urlEvento, edicao, null).andExpect(status().isUnauthorized());
        put(urlEvento, String.format(EVENTO, "2026-11-01T08:00:00"), token).andExpect(status().isBadRequest());
        put("/api/v1/eventos/999", edicao, token).andExpect(status().isNotFound());
        put(urlEvento, edicao, token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Feira Editada"));
        mvc.perform(get(urlEvento)).andExpect(jsonPath("$.titulo").value("Feira Editada"));

        // imagem: exige login, recusa tipo inválido, aceita PNG e serve publicamente
        String urlImagem = "/api/v1/eventos/" + eventoId + "/imagem";
        mvc.perform(get(urlImagem)).andExpect(status().isNotFound());
        mvc.perform(multipart(HttpMethod.PUT, urlImagem).file(arquivo("image/png")))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart(HttpMethod.PUT, urlImagem).file(arquivo("image/gif"))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Formato de imagem não permitido. Use JPG, PNG ou WEBP."));
        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/eventos/999/imagem").file(arquivo("image/png"))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(multipart(HttpMethod.PUT, urlImagem).file(arquivo("image/png"))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagemUrl").value(urlImagem));
        mvc.perform(get(urlImagem))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
        // editar os dados não apaga a imagem
        put(urlEvento, edicao, token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagemUrl").value(urlImagem));
        mvc.perform(get("/api/v1/eventos")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/eventos/999")).andExpect(status().isNotFound());

        inscricoes(token, token("bia@email.com"));
    }

    /** Inscrições usam o relógio real, então o evento abre as inscrições ontem e fecha daqui a uma semana. */
    private void inscricoes(String tokenAna, String tokenBia) throws Exception {
        LocalDateTime agora = LocalDateTime.now();
        String json = EVENTO.replace("2026-12-01T08:00:00", agora.minusDays(1).toString())
                .replace("2027-01-20T09:00:00", agora.plusDays(30).toString())
                .replace("\"capacidade\":50", "\"capacidade\":1");
        String criado = enviar("/api/v1/eventos", String.format(json, agora.plusDays(7).toString()), tokenAna)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long eventoId = mapper.readTree(criado).get("id").asLong();
        String url = "/api/v1/eventos/" + eventoId + "/inscricoes";

        // sem login -> 401; evento inexistente -> 404
        enviar(url, "", null).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/inscricoes/minhas")).andExpect(status().isUnauthorized());
        enviar("/api/v1/eventos/999/inscricoes", "", tokenAna)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensagem").value("Evento não encontrado"));

        // com login -> 201 com código e dados básicos do evento
        enviar(url, "", tokenAna)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value(org.hamcrest.Matchers.matchesPattern("[A-Z0-9]{8}")))
                .andExpect(jsonPath("$.presente").value(false))
                .andExpect(jsonPath("$.evento.id").value(eventoId))
                .andExpect(jsonPath("$.evento.titulo").value("Feira"));

        // repetir -> 409; com a vaga ocupada, outra pessoa também -> 409
        enviar(url, "", tokenAna).andExpect(status().isConflict());
        enviar(url, "", tokenBia).andExpect(status().isConflict());

        // cada um vê só as próprias inscrições
        mvc.perform(get("/api/v1/inscricoes/minhas").header("Authorization", "Bearer " + tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].evento.id").value(eventoId));
        mvc.perform(get("/api/v1/inscricoes/minhas").header("Authorization", "Bearer " + tokenBia))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        portaria(tokenAna, tokenBia);
    }

    private void portaria(String tokenAna, String tokenBia) throws Exception {
        String minhas = mvc.perform(get("/api/v1/inscricoes/minhas").header("Authorization", "Bearer " + tokenAna))
                .andReturn().getResponse().getContentAsString();
        long inscricaoId = mapper.readTree(minhas).get(0).get("id").asLong();
        String codigo = mapper.readTree(minhas).get(0).get("codigo").asText();
        String checkin = "/api/v1/portaria/inscricoes/" + inscricaoId + "/checkin";

        // busca: exige login, q vazio -> 400, encontra por código, CPF e nome
        mvc.perform(get("/api/v1/portaria/busca").param("q", codigo)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/portaria/busca").param("q", " ").header("Authorization", "Bearer " + tokenBia))
                .andExpect(status().isBadRequest());
        for (String q : new String[]{codigo, codigo.toLowerCase(), "11111111111", "111.111.111-11"}) {
            mvc.perform(get("/api/v1/portaria/busca").param("q", q).header("Authorization", "Bearer " + tokenBia))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(inscricaoId))
                    .andExpect(jsonPath("$[0].nome").value("Ana"))
                    .andExpect(jsonPath("$[0].presente").value(false))
                    .andExpect(jsonPath("$[0].eventoTitulo").value("Feira"));
        }

        // check-in: 401 sem login, 404 inexistente, 200, depois 409
        enviar(checkin, "", null).andExpect(status().isUnauthorized());
        enviar("/api/v1/portaria/inscricoes/999999/checkin", "", tokenBia).andExpect(status().isNotFound());
        enviar(checkin, "", tokenBia)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.presente").value(true));
        enviar(checkin, "", tokenBia)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Entrada já registrada"));
        mvc.perform(get("/api/v1/portaria/busca").param("q", codigo).header("Authorization", "Bearer " + tokenBia))
                .andExpect(jsonPath("$[0].presente").value(true));
    }

    private ResultActions put(String url, String json, String token) throws Exception {
        var req = MockMvcRequestBuilders.put(url).contentType(MediaType.APPLICATION_JSON).content(json);
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }
        return mvc.perform(req);
    }

    private static MockMultipartFile arquivo(String tipo) {
        return new MockMultipartFile("arquivo", "capa", tipo, new byte[]{1, 2, 3});
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
