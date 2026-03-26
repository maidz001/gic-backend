package com.taskmanager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2)
                throw new RuntimeException("Invalid JWT format");

            // Thêm padding nếu thiếu
            String payload = parts[1];
            int mod = payload.length() % 4;
            if (mod != 0)
                payload += "=".repeat(4 - mod);

            String decoded = new String(Base64.getUrlDecoder().decode(payload));
            Map<?, ?> claims = objectMapper.readValue(decoded, Map.class);

            String userId = (String) claims.get("sub");
            String email = (String) claims.get("email");

            if (userId != null) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, email,
                        Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

        } catch (Exception e) {
            System.err.println("JWT decode failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}