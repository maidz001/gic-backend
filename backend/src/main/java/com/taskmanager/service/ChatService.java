package com.taskmanager.service;

import com.taskmanager.model.Message;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    private final JdbcTemplate jdbc;
    private final AIService aiService;
    private final TaskService taskService;

    public ChatService(JdbcTemplate jdbc, AIService aiService, TaskService taskService) {
        this.jdbc = jdbc;
        this.aiService = aiService;
        this.taskService = taskService;
    }

    // Lấy messages của 1 task (chỉ user sở hữu task mới xem được)
    public List<Message> getMessages(String taskId, String userId) {
        return jdbc.query(
            "SELECT m.id, m.task_id, m.user_id, m.content, m.is_ai, m.created_at " +
            "FROM messages m JOIN tasks t ON m.task_id = t.id " +
            "WHERE m.task_id = ?::uuid AND t.user_id = ?::uuid " +
            "ORDER BY m.created_at ASC",
            (rs, i) -> {
                Message m = new Message();
                m.setId(rs.getString("id"));
                m.setTaskId(rs.getString("task_id"));
                m.setUserId(rs.getString("user_id"));
                m.setContent(rs.getString("content"));
                m.setAi(rs.getBoolean("is_ai"));
                m.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
                return m;
            },
            taskId, userId
        );
    }

    // Gửi tin nhắn user + tự động gọi AI trả lời
    public List<Message> sendMessage(String taskId, String userId, String content) {
        // 1. Lưu tin nhắn của user
        jdbc.update(
            "INSERT INTO messages (id, task_id, user_id, content, is_ai) VALUES (?::uuid, ?::uuid, ?::uuid, ?, false)",
            UUID.randomUUID().toString(), taskId, userId, content
        );

        // 2. Tạo AI reply dựa trên context
        String aiReply = generateAIReply(userId, taskId, content);

        // 2.5 Kiểm tra và thực thi lệnh cập nhật trạng thái nếu AI phản hồi
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\[COMMAND: SET_STATUS=(TODO|IN_PROGRESS|DONE)\\]").matcher(aiReply);
        if (m.find()) {
            String newStatus = m.group(1);
            try {
                taskService.updateTaskStatus(UUID.fromString(taskId), UUID.fromString(userId), newStatus);
            } catch (Exception ignored) {}
            // Xóa mã lệnh khỏi tin nhắn AI
            aiReply = aiReply.replace(m.group(0), "").trim();
        }

        // 3. Lưu tin nhắn AI
        jdbc.update(
            "INSERT INTO messages (id, task_id, user_id, content, is_ai) VALUES (?::uuid, ?::uuid, ?::uuid, ?, true)",
            UUID.randomUUID().toString(), taskId, userId, aiReply
        );

        // 4. Trả về toàn bộ lịch sử chat
        return getMessages(taskId, userId);
    }

    private String generateAIReply(String userId, String taskId, String userMessage) {
        String currentTask = getTaskDetail(taskId);
        String allTasks    = taskService.getTasksSummary(userId);
        String history     = getRecentChatHistory(taskId);

        String context = String.format(
            "=== TASK ĐANG CHAT ===\n%s\n\n=== TẤT CẢ TASKS ===\n%s\n\n=== LỊCH SỬ CHAT ===\n%s\n\n" +
            "=== HƯỚNG DẪN QUAN TRỌNG ===\n" +
            "Nếu người dùng yêu cầu chuyển trạng thái của task này (ví dụ: bắt đầu, hoàn thành), " +
            "hãy trả lời như bình thường nhưng PHẢI THÊM cụm văn bản sau vào cuối cùng: [COMMAND: SET_STATUS=TRẠNG_THÁI]\n" +
            "Trong đó TRẠNG_THÁI là TODO, IN_PROGRESS hoặc DONE tương ứng.",
            currentTask, allTasks, history
        );

        // Bỏ prefix "/ai" nếu user gõ
        String cleanMsg = userMessage.toLowerCase().startsWith("/ai")
                ? userMessage.substring(3).trim()
                : userMessage;

        return aiService.chat(cleanMsg, context);
    }

    private String getTaskDetail(String taskId) {
        try {
            return jdbc.queryForObject(
                "SELECT title, description, status, priority, deadline, tags FROM tasks WHERE id = ?::uuid",
                (rs, i) -> String.format(
                    "Tiêu đề: %s\nMô tả: %s\nTrạng thái: %s\nƯu tiên: %s\nDeadline: %s\nTags: %s",
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getString("status"),
                    rs.getString("priority"),
                    rs.getTimestamp("deadline") != null ? rs.getTimestamp("deadline").toString() : "Không có",
                    rs.getString("tags")
                ),
                taskId
            );
        } catch (Exception e) {
            return "Không lấy được thông tin task.";
        }
    }

    private String getRecentChatHistory(String taskId) {
        try {
            List<String> history = jdbc.query(
                "SELECT content, is_ai FROM messages WHERE task_id = ?::uuid ORDER BY created_at DESC LIMIT 10",
                (rs, i) -> (rs.getBoolean("is_ai") ? "AI: " : "User: ") + rs.getString("content"),
                taskId
            );
            if (history.isEmpty()) return "Chưa có lịch sử chat.";
            Collections.reverse(history);
            return String.join("\n", history);
        } catch (Exception e) {
            return "Không lấy được lịch sử.";
        }
    }
}
