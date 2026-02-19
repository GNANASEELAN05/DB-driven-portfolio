package com.portfolio.backend.controller;

import com.portfolio.backend.dto.LoginRequest;
import com.portfolio.backend.dto.LoginResponse;
import com.portfolio.backend.model.User;
import com.portfolio.backend.repository.UserRepository;
import com.portfolio.backend.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= KEEP SERVER AWAKE (UPTIMEROBOT) =================
    @GetMapping("/ping")
    public String ping() {
        return "awake";
    }

    // ================= ADMIN LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getUsername(),
                            req.getPassword()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid username or password");
        }

        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 🔥 IMPORTANT FIX HERE
        String role = user.getRole();
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        String token = jwtService.generateToken(user.getUsername(), role);

        return ResponseEntity.ok(new LoginResponse(token));
    }

    // ================= HASH PASSWORD ONLY ONCE =================
    @GetMapping("/hash-admin-once")
    public String hashAdminOnce(@RequestParam String username,
                                @RequestParam String newpass) {

        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String encoded = passwordEncoder.encode(newpass);
        u.setPassword(encoded);
        userRepository.save(u);

        return "Admin password hashed & saved successfully";
    }

    // ================= LOGIN TEST =================
    @GetMapping("/login-test")
    public String loginTest(@RequestParam String username,
                            @RequestParam String password) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (Exception e) {
            return "LOGIN FAILED ❌";
        }

        User u = userRepository.findByUsername(username).orElseThrow();

        String role = u.getRole();
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        String token = jwtService.generateToken(u.getUsername(), role);

        return "LOGIN SUCCESS ✅ TOKEN:\n" + token;
    }
}
