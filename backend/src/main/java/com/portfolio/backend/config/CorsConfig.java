package com.portfolio.backend.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS is handled entirely by SecurityConfig.corsConfigurationSource().
 * Spring Security's CorsFilter runs before the MVC layer, so defining
 * CORS here as well creates conflicts. This class is kept as a placeholder.
 */
@Configuration
public class CorsConfig {
    // intentionally empty
}