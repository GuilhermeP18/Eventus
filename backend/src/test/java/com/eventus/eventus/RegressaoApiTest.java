package com.eventus.eventus;

import com.eventus.eventus.repository.DependenteRepository;
import com.eventus.eventus.repository.EventoRepository;
import com.eventus.eventus.repository.InscricaoRepository;
import com.eventus.eventus.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suíte regressiva de API cobrindo todos os módulos do sistema:
 * saúde, autenticação/perfil, dependentes, eventos/mídia, inscrições e portaria.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RegressaoApiTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper mapper;

    @Autowired
    InscricaoRepository inscricoes;

    @Autowired
    DependenteRepository dependentes;

    @Autowired
    EventoRepository eventos;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void limparBanco() {
        inscricoes.deleteAll();
        dependentes.deleteAll();
        eventos.deleteAll();
        usuarios.deleteAll();
        // application-test.properties define o usuário de ID 1 como operador da portaria;
        // reiniciar a identidade garante que o primeiro usuário cadastrado em cada teste seja o operador.
        jdbc.execute("ALTER TABLE usuarios ALTER COLUMN id RESTART WITH 1");
    }

    @Test
    void healthCheckPublicoRetornaUp() throws Exception {
        mvc.perform(get("/api/v1/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void rotasProtegidasExigemTokenValido() throws Exception {
        String tokenInvalido = "Bearer token.invalido.aqui";
        String perfilValido = """
                {"nome":"Teste","telefone":"47999990000","dataNascimento":"1990-01-01",
                 "endereco":{"cep":"89201-100","rua":"Rua XV","numero":"100","bairro":"Centro","cidade":"Joinville","uf":"SC"}}
                """;

        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", tokenInvalido)).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/auth/me").contentType(MediaType.APPLICATION_JSON).content(perfilValido))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/dependentes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/dependentes").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/eventos").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/eventos/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/eventos/1/imagem").file(imagem("image/png")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/eventos/1/inscricoes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/inscricoes/minhas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/portaria/busca").param("q", "ABC")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/portaria/inscricoes/1/checkin")).andExpect(status().isUnauthorized());
    }

    @Test
    void cadastroLoginEAtualizacaoDePerfilPreservamEmailECpf() throws Exception {
        mvc.perform(post("/api/v1/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cadastroJson("Menor", "menor@email.com", "00011122233", "2012-01-01")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("É necessário ter pelo menos 18 anos"));

        mvc.perform(post("/api/v1/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"email\":\"invalido\",\"cpf\":\"123\",\"senha\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.cpf").exists())
                .andExpect(jsonPath("$.campos.senha").exists());

        mvc.perform(post("/api/v1/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cadastroJson("Carlos Souza", "Carlos@Email.com", "123.456.789-01", "1991-04-20")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("carlos@email.com"))
                .andExpect(jsonPath("$.cpf").value("12345678901"))
                .andExpect(jsonPath("$.endereco.uf").value("SC"))
                .andExpect(jsonPath("$.senha").doesNotExist());

        String token = autenticar("carlos@email.com");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Souza"))
                .andExpect(jsonPath("$.email").value("carlos@email.com"));

        String atualizacao = """
                {"nome":"Carlos Atualizado","telefone":"47988887777","dataNascimento":"1991-04-20",
                 "endereco":{"cep":"89201-100","rua":"Rua das Palmeiras","numero":"250","complemento":"Apto 2",
                 "bairro":"Centro","cidade":"Joinville","uf":"sc"}}
                """;
        mvc.perform(put("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(atualizacao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Atualizado"))
                .andExpect(jsonPath("$.telefone").value("47988887777"))
                .andExpect(jsonPath("$.email").value("carlos@email.com"))
                .andExpect(jsonPath("$.cpf").value("12345678901"))
                .andExpect(jsonPath("$.endereco.uf").value("SC"));
    }

    @Test
    void eventosListagemOrdenadaValidacoesEUploadDeImagem() throws Exception {
        String token = cadastrarEAutenticar("Org", "org@email.com", "11122233344");
        LocalDateTime agora = LocalDateTime.now();

        mvc.perform(post("/api/v1/eventos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventoJson("Inválido", agora.plusDays(10), 0, agora.plusDays(1), agora.plusDays(2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.capacidade").exists());

        mvc.perform(post("/api/v1/eventos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventoJson("Segundo", agora.plusDays(20), 30, agora.minusDays(1), agora.plusDays(5))))
                .andExpect(status().isCreated());

        String primeiroCriado = mvc.perform(post("/api/v1/eventos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventoJson("Primeiro", agora.plusDays(5), 20, agora.minusDays(1), agora.plusDays(4))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long idPrimeiro = mapper.readTree(primeiroCriado).get("id").asLong();

        mvc.perform(get("/api/v1/eventos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].titulo").value("Primeiro"))
                .andExpect(jsonPath("$[1].titulo").value("Segundo"));

        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/eventos/" + idPrimeiro + "/imagem")
                        .file(imagem("image/webp"))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagemUrl").value("/api/v1/eventos/" + idPrimeiro + "/imagem"));

        mvc.perform(get("/api/v1/eventos/" + idPrimeiro + "/imagem"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"));
    }

    @Test
    void inscricoesRespeitamPeriodoCapacidadeUnicidadeEMinhasInscricoes() throws Exception {
        String tokOrg = cadastrarEAutenticar("Org", "org2@email.com", "22233344455");
        String tokP1 = cadastrarEAutenticar("Participante 1", "p1@email.com", "33344455566");
        String tokP2 = cadastrarEAutenticar("Participante 2", "p2@email.com", "44455566677");
        String tokP3 = cadastrarEAutenticar("Participante 3", "p3@email.com", "55566677788");
        LocalDateTime agora = LocalDateTime.now();

        long idFuturo = criarEvento(tokOrg, "Futuro", agora.plusDays(20), 10, agora.plusDays(2), agora.plusDays(10));
        long idEncerrado = criarEvento(tokOrg, "Encerrado", agora.plusDays(20), 10, agora.minusDays(10), agora.minusDays(1));
        long idAberto = criarEvento(tokOrg, "Aberto", agora.plusDays(20), 2, agora.minusDays(1), agora.plusDays(5));

        postAuth("/api/v1/eventos/" + idFuturo + "/inscricoes", "", tokP1).andExpect(status().isConflict());
        postAuth("/api/v1/eventos/" + idEncerrado + "/inscricoes", "", tokP1).andExpect(status().isConflict());

        postAuth("/api/v1/eventos/" + idAberto + "/inscricoes", "", tokP1)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo", matchesPattern("[A-Z0-9]{8}")))
                .andExpect(jsonPath("$.presente").value(false));

        postAuth("/api/v1/eventos/" + idAberto + "/inscricoes", "", tokP1)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Você já está inscrito neste evento"));

        postAuth("/api/v1/eventos/" + idAberto + "/inscricoes", "", tokP2)
                .andExpect(status().isCreated());

        postAuth("/api/v1/eventos/" + idAberto + "/inscricoes", "", tokP3)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Evento sem vagas disponíveis"));

        mvc.perform(get("/api/v1/inscricoes/minhas").header("Authorization", "Bearer " + tokP1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].evento.titulo").value("Aberto"));

        mvc.perform(get("/api/v1/inscricoes/minhas").header("Authorization", "Bearer " + tokP3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void portariaBuscaECheckinUnico() throws Exception {
        String tokOp = cadastrarEAutenticar("Operador", "op@email.com", "66677788899");
        String tokPart = cadastrarEAutenticar("Mariana Costa", "mariana@email.com", "77788899900");
        LocalDateTime agora = LocalDateTime.now();

        long eventoId = criarEvento(tokOp, "Simpósio", agora.plusDays(15), 10, agora.minusDays(1), agora.plusDays(3));
        String respInsc = postAuth("/api/v1/eventos/" + eventoId + "/inscricoes", "", tokPart)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode insc = mapper.readTree(respInsc);
        long inscricaoId = insc.get("id").asLong();
        String codigo = insc.get("codigo").asText();

        mvc.perform(get("/api/v1/portaria/busca").param("q", "   ").header("Authorization", "Bearer " + tokOp))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/v1/portaria/busca").param("q", "inexistente").header("Authorization", "Bearer " + tokOp))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        for (String termo : new String[]{codigo, codigo.toLowerCase(), "mariana", "77788899900", "777.888.999-00"}) {
            mvc.perform(get("/api/v1/portaria/busca").param("q", termo).header("Authorization", "Bearer " + tokOp))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id").value(inscricaoId));
        }

        postAuth("/api/v1/portaria/inscricoes/" + inscricaoId + "/checkin", "", tokOp)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.presente").value(true));

        postAuth("/api/v1/portaria/inscricoes/" + inscricaoId + "/checkin", "", tokOp)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("Entrada já registrada"));

        postAuth("/api/v1/portaria/inscricoes/999999/checkin", "", tokOp)
                .andExpect(status().isNotFound());
    }

    @Test
    void dependentesOrdenacaoValidacaoEIsolamentoEntreUsuarios() throws Exception {
        String tokA = cadastrarEAutenticar("Responsável A", "respa@email.com", "88899900011");
        String tokB = cadastrarEAutenticar("Responsável B", "respb@email.com", "99900011122");

        postAuth("/api/v1/dependentes", "{\"nome\":\"Zeca\",\"dataNascimento\":\"2030-01-01\"}", tokA)
                .andExpect(status().isBadRequest());
        postAuth("/api/v1/dependentes", "{\"nome\":\"\",\"dataNascimento\":\"2015-05-05\"}", tokA)
                .andExpect(status().isBadRequest());

        postAuth("/api/v1/dependentes", "{\"nome\":\"Zeca\",\"dataNascimento\":\"2015-05-05\"}", tokA)
                .andExpect(status().isCreated());
        postAuth("/api/v1/dependentes", "{\"nome\":\"Alice\",\"dataNascimento\":\"2018-09-10\"}", tokA)
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/dependentes").header("Authorization", "Bearer " + tokA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nome").value("Alice"))
                .andExpect(jsonPath("$[1].nome").value("Zeca"));

        mvc.perform(get("/api/v1/dependentes").header("Authorization", "Bearer " + tokB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    private String cadastrarEAutenticar(String nome, String email, String cpf) throws Exception {
        mvc.perform(post("/api/v1/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cadastroJson(nome, email, cpf, "1990-01-01")))
                .andExpect(status().isCreated());
        return autenticar(email);
    }

    private String autenticar(String email) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"SenhaForte123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("token").asText();
    }

    private long criarEvento(String token, String titulo, LocalDateTime data, int capacidade,
                             LocalDateTime inicio, LocalDateTime fim) throws Exception {
        String body = postAuth("/api/v1/eventos", eventoJson(titulo, data, capacidade, inicio, fim), token)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("id").asLong();
    }

    private ResultActions postAuth(String url, String json, String token) throws Exception {
        return mvc.perform(post(url)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private static String cadastroJson(String nome, String email, String cpf, String nascimento) {
        return """
                {"nome":"%s","email":"%s","telefone":"47999990000","cpf":"%s","dataNascimento":"%s",
                 "senha":"SenhaForte123",
                 "endereco":{"cep":"89201-100","rua":"Rua XV","numero":"100","bairro":"Centro","cidade":"Joinville","uf":"sc"}}
                """.formatted(nome, email, cpf, nascimento);
    }

    private static String eventoJson(String titulo, LocalDateTime data, int capacidade,
                                     LocalDateTime inicio, LocalDateTime fim) {
        return """
                {"titulo":"%s","descricao":"Descrição","data":"%s","local":"Auditório","capacidade":%d,
                 "inscricaoInicio":"%s","inscricaoFim":"%s"}
                """.formatted(titulo, data, capacidade, inicio, fim);
    }

    private static MockMultipartFile imagem(String tipo) {
        return new MockMultipartFile("arquivo", "capa", tipo, new byte[]{1, 2, 3, 4});
    }
}
