package com.taskmanager.controller;

import com.taskmanager.model.Message;
import com.taskmanager.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    private String getUserId(Authentication auth) {
        return auth.getPrincipal().toString();
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String taskId,
            Authentication auth) {
        return ResponseEntity.ok(chatService.getMessages(taskId, getUserId(auth)));
    }

    @PostMapping("/{taskId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nội dung không được trống"));
        }

        try {
            List<Message> messages = chatService.sendMessage(taskId, getUserId(auth), content);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Chat error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
