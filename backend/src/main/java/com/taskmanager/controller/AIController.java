package com.taskmanager.controller;

import com.taskmanager.model.Task;
import com.taskmanager.service.AIService;
import com.taskmanager.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;
    private final TaskService taskService;

    public AIController(AIService aiService, TaskService taskService) {
        this.aiService = aiService;
        this.taskService = taskService;
    }

    private String getUserEmail(Authentication auth) {
        Object credentials = auth.getCredentials();
        return credentials != null ? credentials.toString() : null;
    }

    @PostMapping("/suggest")
    public ResponseEntity<Map<String, String>> suggest(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getPrincipal().toString());
        String message = body.getOrDefault("message", "Tổng quan công việc");

        try {
            List<Task> tasks = taskService.getTasksByUserForAI(userId);
            String suggestion = aiService.getAISuggestion(message, tasks);
            return ResponseEntity.ok(Map.of("suggestion", suggestion));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI Error: " + e.getMessage()));
        }
    }

    @PostMapping("/global-chat")
    public ResponseEntity<?> globalChat(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getPrincipal().toString());
        String userMessage = body.get("message") != null ? body.get("message").toString() : null;
        String history = body.get("history") != null ? body.get("history").toString() : "";
        
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        try {
            // Get all tasks for context
            List<Task> tasks = taskService.getTasksByUserForAI(userId);
            
            // Generate Reply
            String aiReply = aiService.getGlobalChatResponse(userMessage, tasks, history);
            
            boolean taskUpdated = aiReply.contains("[COMMAND:");

            // Command Parsing (CREATE_TASK, UPDATE_TASK, DELETE_TASK)
            aiReply = parseAndExecuteGlobalCommands(aiReply, userId, getUserEmail(auth));

            return ResponseEntity.ok(Map.of(
                "reply", aiReply,
                "taskUpdated", taskUpdated
            ));
        } catch (Exception e) {
            System.err.println("Global Chat Error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI Error: " + e.getMessage()));
        }
    }

    private String parseAndExecuteGlobalCommands(String aiReply, UUID userId, String userEmail) {
        // [COMMAND: CREATE_TASK title="xxx" priority="HIGH"]
        java.util.regex.Matcher mCreate = java.util.regex.Pattern.compile("\\[COMMAND:\\s*CREATE_TASK\\s+title=\"(.*?)\"\\s*(?:priority=\"(.*?)\")?\\s*\\]").matcher(aiReply);
        while (mCreate.find()) {
            String title = mCreate.group(1);
            String priority = mCreate.group(2) != null ? mCreate.group(2) : "MEDIUM";
            try {
                Task nt = new Task();
                nt.setUserId(userId);
                nt.setUserEmail(userEmail);
                nt.setTitle(title);
                nt.setPriority(priority);
                nt.setStatus("TODO");
                taskService.createTask(nt);
            } catch (Exception ignored) {}
            aiReply = aiReply.replace(mCreate.group(0), "").trim();
        }

        // [COMMAND: UPDATE_TASK id="xxx" status="DONE" priority="HIGH"]
        java.util.regex.Matcher mUpdate = java.util.regex.Pattern.compile("\\[COMMAND:\\s*UPDATE_TASK\\s+id=\"(.*?)\"\\s*(?:status=\"(.*?)\")?\\s*(?:priority=\"(.*?)\")?\\s*\\]").matcher(aiReply);
        while (mUpdate.find()) {
            String id = mUpdate.group(1);
            String status = mUpdate.group(2);
            try {
                if (status != null && !status.isBlank()) {
                    taskService.updateTaskStatus(UUID.fromString(id), userId, status);
                }
            } catch (Exception ignored) {}
            aiReply = aiReply.replace(mUpdate.group(0), "").trim();
        }

        // [COMMAND: DELETE_TASK id="xxx"]
        java.util.regex.Matcher mDelete = java.util.regex.Pattern.compile("\\[COMMAND:\\s*DELETE_TASK\\s+id=\"(.*?)\"\\]").matcher(aiReply);
        while (mDelete.find()) {
            String id = mDelete.group(1);
            try {
                taskService.deleteTask(UUID.fromString(id), userId);
            } catch (Exception ignored) {}
            aiReply = aiReply.replace(mDelete.group(0), "").trim();
        }

        return aiReply.trim();
    }
}
