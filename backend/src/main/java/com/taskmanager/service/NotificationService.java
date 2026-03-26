package com.taskmanager.service;

import com.taskmanager.model.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final TaskService taskService;

    @Value("${app.notification.email:}")
    private String notificationEmail;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public NotificationService(JavaMailSender mailSender, TaskService taskService) {
        this.mailSender = mailSender;
        this.taskService = taskService;
    }

    public TaskService getTaskService() {
        return taskService;
    }

    public void sendDeadlineReminders() {
        List<Task> upcomingTasks = taskService.getTasksWithUpcomingDeadlines();

        if (upcomingTasks.isEmpty()) {
            log.info("No upcoming deadlines in the next 24 hours.");
            return;
        }

        log.info("Found {} tasks with upcoming deadlines", upcomingTasks.size());

        java.util.Map<String, List<Task>> tasksByEmail = upcomingTasks.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                t -> (t.getUserEmail() != null && !t.getUserEmail().isBlank()) ? t.getUserEmail() : (notificationEmail != null ? notificationEmail : "")
            ));

        for (java.util.Map.Entry<String, List<Task>> entry : tasksByEmail.entrySet()) {
            String recipient = entry.getKey();
            if (recipient.isBlank()) {
                log.warn("No notification email found for some tasks. Logging deadlines only.");
                entry.getValue().forEach(t ->
                        log.warn("⚠️ DEADLINE SOON: \"{}\" - Due: {}", t.getTitle(), t.getDeadline()));
                continue;
            }

            StringBuilder body = new StringBuilder();
            body.append("🔔 Nhắc nhở deadline - Các task sắp đến hạn:\n\n");

            for (Task task : entry.getValue()) {
                body.append(String.format("📌 %s\n   Priority: %s | Deadline: %s | Status: %s\n\n",
                        task.getTitle(), task.getPriority(), task.getDeadline(), task.getStatus()));
            }

            body.append("Hãy hoàn thành các task trên trước deadline nhé! 💪");

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipient);
                message.setSubject("🔔 Task Manager - Nhắc nhở deadline");
                message.setText(body.toString());
                mailSender.send(message);
                log.info("✅ Deadline reminder email sent to {}", recipient);
            } catch (Exception e) {
                log.error("❌ Failed to send deadline email: {}", e.getMessage());
                entry.getValue().forEach(t ->
                        log.warn("⚠️ DEADLINE SOON: \"{}\" - Due: {}", t.getTitle(), t.getDeadline()));
            }
        }
    }

    public void send30MinDeadlineReminders() {
        List<Task> upcomingTasks = taskService.getTasksWithDeadlinesIn30Mins();

        if (upcomingTasks.isEmpty()) {
            return;
        }

        for (Task task : upcomingTasks) {
            String recipient = task.getUserEmail();
            if (recipient == null || recipient.isBlank()) recipient = notificationEmail;
            if (recipient == null || recipient.isBlank()) continue;

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipient);
                message.setSubject("⏰ Sắp đến hạn: " + task.getTitle());
                message.setText("Task của bạn chỉ còn khoảng 30 phút nữa là đến hạn!\n\n" +
                        "Chi tiết:\n" +
                        "📌 Tên task: " + task.getTitle() + "\n" +
                        "⏰ Deadline: " + task.getDeadline() + "\n" +
                        "🚀 Mức ưu tiên: " + task.getPriority() + "\n\n" +
                        "Hãy nhanh chóng hoàn thành và cập nhật trạng thái nhé!");
                mailSender.send(message);
                log.info("✅ 30-min reminder email sent for task: {}", task.getTitle());
            } catch (Exception e) {
                log.error("❌ Failed to send 30-min deadline email: {}", e.getMessage());
            }
        }
    }

    public void sendTaskStartedEmails(List<Task> startedTasks) {
        if (startedTasks.isEmpty()) return;

        for (Task task : startedTasks) {
            String recipient = task.getUserEmail();
            if (recipient == null || recipient.isBlank()) recipient = notificationEmail;
            if (recipient == null || recipient.isBlank()) continue;

            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail);
                msg.setTo(recipient);
                msg.setSubject("▶️ Task tự động bắt đầu: " + task.getTitle());
                msg.setText("Một task của bạn đã đến giờ thực hiện dự kiến và được tự động chuyển sang trạng thái In Progress!\n\n" +
                            "📌 Tên task: " + task.getTitle() + "\n" +
                            "⏰ Thời gian bắt đầu: " + task.getScheduledStartTime() + "\n\n" +
                            "Chúc bạn làm việc hiệu quả nhé!");
                mailSender.send(msg);
                log.info("✅ Auto start email sent for task: {}", task.getTitle());
            } catch (Exception e) {
                log.error("❌ Failed to send auto start email: {}", e.getMessage());
            }
        }
    }
}
