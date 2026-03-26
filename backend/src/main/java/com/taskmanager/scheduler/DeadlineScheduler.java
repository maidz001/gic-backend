package com.taskmanager.scheduler;

import com.taskmanager.model.Task;
import com.taskmanager.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DeadlineScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeadlineScheduler.class);

    private final NotificationService notificationService;

    public DeadlineScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Run every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void checkDeadlines() {
        log.info("🕐 Running daily deadline check...");
        notificationService.sendDeadlineReminders();
    }

    // Run every minute
    @Scheduled(cron = "0 * * * * *")
    public void check30MinDeadlines() {
        notificationService.send30MinDeadlineReminders();
        
        // Cập nhật tasks đến giờ bắt đầu tự động và gửi email
        List<Task> startedTasks = notificationService.getTaskService().autoStartScheduledTasks();
        notificationService.sendTaskStartedEmails(startedTasks);
    }
}
