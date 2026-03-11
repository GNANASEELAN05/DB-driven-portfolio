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

            // allow iframe preview
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))

            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth

                // preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // auth login
                .requestMatchers("/api/auth/**").permitAll()

                // ===== PUBLIC VIEWER =====
                .requestMatchers(HttpMethod.GET, "/api/portfolio/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resume/**").permitAll()

                // ===== PUBLIC: Profile Images (viewer reads them) =====
                .requestMatchers(HttpMethod.GET, "/api/profile-image/**").permitAll()

                // ===== ADMIN =====
                .requestMatchers(HttpMethod.POST, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/projects/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.PUT,  "/api/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/portfolio/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/portfolio/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/resume/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/resume/**").hasRole("ADMIN")

                // ===== ADMIN: Profile Image upload/delete =====
                .requestMatchers(HttpMethod.POST, "/api/profile-image/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/profile-image/**").hasRole("ADMIN")

                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 🌍 CORS FOR LOCAL + VERCEL LIVE
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        cfg.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://gnanaseelan-v-portfolio.vercel.app"
        ));

        // allow everything needed for admin + viewer
        cfg.addAllowedHeader("*");
        cfg.addAllowedMethod("*");
        cfg.setAllowCredentials(true);

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