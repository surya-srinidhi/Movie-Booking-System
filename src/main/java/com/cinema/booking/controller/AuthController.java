package com.cinema.booking.controller;

import com.cinema.booking.dto.LoginRequest;
import com.cinema.booking.dto.RegisterRequest;
import com.cinema.booking.dto.UserResponse;
import com.cinema.booking.model.User;
import com.cinema.booking.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is already in use"));
        }

        // Set default role as CUSTOMER if not provided or invalid
        String role = request.getRole();
        if (role == null || (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("CUSTOMER"))) {
            role = "CUSTOMER";
        } else {
            role = role.toUpperCase();
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                request.getPassword(), // Standard cleartext password for easy testing
                role
        );

        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful! You can now log in."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        HttpSession session = servletRequest.getSession(true);
        session.setAttribute("user", user);

        return ResponseEntity.ok(new UserResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest servletRequest) {
        HttpSession session = servletRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest servletRequest) {
        HttpSession session = servletRequest.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = (User) session.getAttribute("user");
        // Reload from database to ensure fresh data
        Optional<User> freshUser = userRepository.findById(user.getId());
        if (freshUser.isEmpty()) {
            session.invalidate();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User no longer exists"));
        }

        return ResponseEntity.ok(new UserResponse(freshUser.get()));
    }
}
