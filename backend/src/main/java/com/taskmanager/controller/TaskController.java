package com.taskmanager.controller;

import com.taskmanager.model.Task;
import com.taskmanager.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    private UUID getUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }

    private String getUserEmail(Authentication auth) {
        Object credentials = auth.getCredentials();
        return credentials != null ? credentials.toString() : null;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(Authentication auth) {
        return ResponseEntity.ok(taskService.getTasksByUser(getUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task, Authentication auth) {
        try {
            task.setUserId(getUserId(auth));
            task.setUserEmail(getUserEmail(auth));
            // Đảm bảo default values
            if (task.getStatus() == null) task.setStatus("TODO");
            if (task.getPriority() == null) task.setPriority("MEDIUM");
            Task created = taskService.createTask(task);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            // Log lỗi chi tiết để debug
            System.err.println("Error creating task: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            taskService.updateTaskStatus(id, getUserId(auth), body.get("status"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable UUID id,
            @RequestBody Task task,
            Authentication auth) {
        try {
            taskService.updateTask(id, getUserId(auth), task);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable UUID id, Authentication auth) {
        try {
            taskService.deleteTask(id, getUserId(auth));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
