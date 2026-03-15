package com.portfolio.backend.utils;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHashPrinter implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "GnanaV@3791"; // ← change this
        String hashed = encoder.encode(password);
        
        System.out.println("===========================================");
        System.out.println("BCRYPT HASH FOR SQL INSERT:");
        System.out.println(hashed);
        System.out.println("===========================================");
    }
}