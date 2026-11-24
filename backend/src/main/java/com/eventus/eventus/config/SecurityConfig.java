package com.eventus.eventus.config;

import com.eventus.eventus.exception.ErroResponse;
import com.eventus.eventus.security.JwtAuthenticationFilter;
import com.eventus.eventus.security.JwtService;
import com.eventus.eventus.security.PortariaOperadores;
import com.eventus.eventus.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.time.Clock;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
                                                   PortariaOperadores operadores, UsuarioRepository usuarios,
                                                   ObjectMapper mapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/test", "/api/v1/auth/cadastro", "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/eventos", "/api/v1/eventos/*",
                                "/api/v1/eventos/*/imagem").permitAll()
                        .requestMatchers("/api/v1/portaria/**").hasRole("OPERADOR")
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                escrever(res, mapper, HttpStatus.UNAUTHORIZED, "Autenticação necessária"))
                        .accessDeniedHandler((req, res, ex) ->
                                escrever(res, mapper, HttpStatus.FORBIDDEN, "Acesso negado")))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, operadores, usuarios),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }

    /** Erros 401/403 acontecem antes dos controllers, então são escritos aqui no mesmo formato do handler global. */
    private static void escrever(HttpServletResponse res, ObjectMapper mapper, HttpStatus status,
                                 String mensagem) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getOutputStream(), ErroResponse.de(status, mensagem));
    }
}
