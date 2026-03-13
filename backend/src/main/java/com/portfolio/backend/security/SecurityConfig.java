package com.portfolio.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers("/api/auth/**").permitAll()

                // PUBLIC VIEWER
                .requestMatchers(HttpMethod.GET, "/api/portfolio/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resume/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/profile-image/**").permitAll()

                // ADMIN — projects
                .requestMatchers(HttpMethod.POST,   "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasRole("ADMIN")

                // ADMIN — portfolio
                .requestMatchers(HttpMethod.PUT,    "/api/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/portfolio/**").hasRole("ADMIN")

                // ADMIN — resume
                .requestMatchers(HttpMethod.POST,   "/api/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/resume/**").hasRole("ADMIN")

                // ADMIN — profile image
                .requestMatchers(HttpMethod.POST,   "/api/profile-image/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/profile-image/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/profile-image/**").hasRole("ADMIN")

                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        cfg.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "https://gnanaseelan-v-portfolio.vercel.app"
        ));

        cfg.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        cfg.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));

        cfg.setExposedHeaders(List.of(
            "Content-Disposition",
            "Content-Type"
        ));

        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}