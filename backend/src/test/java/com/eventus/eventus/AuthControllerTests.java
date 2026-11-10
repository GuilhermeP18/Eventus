package com.eventus.eventus;

import com.eventus.eventus.repository.UsuarioRepository;
import com.eventus.eventus.service.LoginAttemptService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private LoginAttemptService loginAttempts;

    @BeforeEach
    void cleanDatabase() {
        usuarios.deleteAll();
        loginAttempts.clear();
    }

    @Test
    void registersAdultAndCreatesServerSessionOnLogin() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Ana Souza", "ana@example.com", "12345678901",
                                LocalDate.now().minusYears(30), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canCreateEvents").value(true))
                .andExpect(jsonPath("$.responsibleEmail").doesNotExist());

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "ANA@example.com",
                                "password", "senha-segura-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        org.junit.jupiter.api.Assertions.assertNotNull(session);

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ana Souza"))
                .andExpect(jsonPath("$.canCreateEvents").value(true));

        mockMvc.perform(post("/api/v1/auth/logout").session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void linksMinorToExistingAdultAndDisallowsEventCreation() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Responsável", "adult@example.com", "12345678901",
                                LocalDate.now().minusYears(35), null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Pessoa menor", "minor@example.com", "23456789012",
                                LocalDate.now().minusYears(15), "adult@example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canCreateEvents").value(false))
                .andExpect(jsonPath("$.responsibleEmail").value("adult@example.com"));

    }

    @Test
    void rejectsMinorWithoutAnAlreadyRegisteredAdultResponsible() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Pessoa menor", "minor@example.com", "23456789012",
                                LocalDate.now().minusYears(15), "missing@example.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("conta cadastrada")))
                .andExpect(jsonPath("$.field").value("responsibleEmail"));
    }

    @Test
    void logoutIsSafeWhenNoSessionExists() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsDuplicateEmailAndCpf() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Ana Souza", "ana@example.com", "12345678901",
                                LocalDate.now().minusYears(30), null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Outra pessoa", "ANA@example.com", "23456789012",
                                LocalDate.now().minusYears(30), null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field").value("email"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Outra pessoa", "outra@example.com", "123.456.789-01",
                                LocalDate.now().minusYears(30), null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field").value("cpf"));
    }

    @Test
    void blocksLoginAfterFiveInvalidAttemptsWithGenericCredentialsMessage() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Ana Souza", "ana@example.com", "12345678901",
                                LocalDate.now().minusYears(30), null)))
                .andExpect(status().isCreated());

        String invalidPassword = objectMapper.writeValueAsString(Map.of(
                "email", "ana@example.com",
                "password", "senha-incorreta"));
        for (int attempt = 1; attempt < LoginAttemptService.MAX_ATTEMPTS; attempt++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPassword))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("E-mail ou senha incorretos"));
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPassword))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.retryAfterMs").isNumber());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "ana@example.com",
                                "password", "senha-segura-123"))))
                .andExpect(status().isLocked());
    }

    private String registerBody(String name, String email, String cpf, LocalDate birthDate,
                                String responsibleEmail) throws Exception {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("name", name);
        body.put("email", email);
        body.put("cpf", cpf);
        body.put("phone", "47999990000");
        body.put("birthDate", birthDate);
        body.put("responsibleEmail", responsibleEmail);
        body.put("password", "senha-segura-123");
        return objectMapper.writeValueAsString(body);
    }
}
