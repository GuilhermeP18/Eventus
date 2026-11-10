package com.eventus.eventus.service;

import com.eventus.eventus.dto.AuthDtos.LoginRequest;
import com.eventus.eventus.dto.AuthDtos.RegisterRequest;
import com.eventus.eventus.dto.AuthDtos.UserResponse;
import com.eventus.eventus.model.Usuario;
import com.eventus.eventus.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int ADULT_AGE = 18;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_BCRYPT_BYTES = 72;
    private static final String INVALID_CREDENTIALS = "E-mail ou senha incorretos";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttempts;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, LoginAttemptService loginAttempts) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.loginAttempts = loginAttempts;
    }

    @Transactional
    public UserResponse register(RegisterRequest input) {
        if (input == null) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Informe os dados do cadastro", null);
        }
        String name = trim(input.name());
        String email = normalizeEmail(input.email());
        String cpf = digits(input.cpf());
        String phone = trim(input.phone());
        LocalDate birthDate = input.birthDate();
        String password = input.password() == null ? "" : input.password();

        require(!name.isEmpty(), "Informe seu nome completo", "name");
        require(name.length() <= 150, "O nome deve ter até 150 caracteres", "name");
        require(EMAIL_PATTERN.matcher(email).matches() && email.length() <= 150, "Informe um e-mail válido", "email");
        require(cpf.length() == 11, "Informe um CPF com 11 dígitos", "cpf");
        require(!phone.isEmpty() && phone.length() <= 20, "Informe um telefone com até 20 caracteres", "phone");
        require(birthDate != null && !birthDate.isAfter(LocalDate.now()), "Informe uma data de nascimento válida", "birthDate");
        require(password.length() >= MIN_PASSWORD_LENGTH, "A senha deve ter pelo menos 8 caracteres", "password");
        require(password.getBytes(StandardCharsets.UTF_8).length <= MAX_BCRYPT_BYTES, "A senha deve ter no máximo 72 bytes", "password");

        Usuario responsible = null;
        if (age(birthDate) < ADULT_AGE) {
            String responsibleEmail = normalizeEmail(input.responsibleEmail());
            require(!responsibleEmail.isEmpty(), "Informe o e-mail do responsável adulto já cadastrado", "responsibleEmail");
            require(!responsibleEmail.equals(email), "O responsável deve ser outra pessoa", "responsibleEmail");
            responsible = usuarios.findByEmailIgnoreCase(responsibleEmail)
                    .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST,
                            "O responsável precisa ter uma conta cadastrada", "responsibleEmail"));
            require(responsible.isAtivo(), "A conta do responsável está inativa", "responsibleEmail");
            require(age(responsible.getDataNascimento()) >= ADULT_AGE,
                    "O responsável precisa ser maior de 18 anos", "responsibleEmail");
        }

        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail", "email");
        }
        if (usuarios.existsByCpf(cpf)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe uma conta com este CPF", "cpf");
        }

        Usuario usuario = new Usuario(name, email, passwordEncoder.encode(password), cpf, phone, birthDate, responsible);
        return toResponse(usuarios.save(usuario));
    }

    @Transactional(readOnly = true)
    public AuthenticatedSession login(LoginRequest input) {
        if (input == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS, null);
        }
        String email = normalizeEmail(input.email());
        String password = input.password() == null ? "" : input.password();
        if (email.isEmpty() || password.isEmpty()) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS, null);
        }

        long remainingLockMs = loginAttempts.remainingLockMs(email);
        if (remainingLockMs > 0) {
            throw locked(remainingLockMs);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, password));
            loginAttempts.recordSuccess(email);
            Usuario usuario = usuarios.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new AuthenticationServiceException("Conta autenticada não encontrada"));
            return new AuthenticatedSession(authentication, toResponse(usuario));
        } catch (AuthenticationException exception) {
            long lockMs = loginAttempts.recordFailure(email);
            if (lockMs > 0) {
                throw locked(lockMs);
            }
            throw new AuthException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS, null);
        }
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        Usuario usuario = usuarios.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "Sessão inválida", null));
        return toResponse(usuario);
    }

    private UserResponse toResponse(Usuario usuario) {
        String responsibleEmail = usuario.getResponsavel() == null ? null : usuario.getResponsavel().getEmail();
        return new UserResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getTelefone(),
                usuario.getDataNascimento(), responsibleEmail, age(usuario.getDataNascimento()) >= ADULT_AGE);
    }

    private static AuthException locked(long remainingMs) {
        long minutes = Math.max(1, (long) Math.ceil(remainingMs / 60_000.0));
        return new AuthException(HttpStatus.LOCKED,
                "Muitas tentativas incorretas. Login bloqueado por " + minutes + " min para este e-mail.",
                null, remainingMs);
    }

    private static void require(boolean condition, String message, String field) {
        if (!condition) {
            throw new AuthException(HttpStatus.BAD_REQUEST, message, field);
        }
    }

    private static int age(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String normalizeEmail(String email) {
        return trim(email).toLowerCase(Locale.ROOT);
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    public record AuthenticatedSession(Authentication authentication, UserResponse user) {
    }
}
