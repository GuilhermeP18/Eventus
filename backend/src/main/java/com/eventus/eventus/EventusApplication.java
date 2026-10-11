package com.eventus.eventus;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Locale;
import java.util.TimeZone;

@SpringBootApplication
public class EventusApplication {

	@PostConstruct
	public void init() {
		// Define o idioma padrão para Português do Brasil
		Locale.setDefault(new Locale("pt", "BR"));
		// Define o fuso horário padrão do Brasil
		TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
	}

	public static void main(String[] args) {
		SpringApplication.run(EventusApplication.class, args);
	}
}