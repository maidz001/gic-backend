package com.taskmanager;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TaskManagerApplication {

    @Bean
    public CommandLineRunner initDb(JdbcTemplate jdbc) {
        return args -> {
            try {
                jdbc.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE");
                jdbc.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE");
                jdbc.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE");
                jdbc.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)");
                System.out.println("✅ Database schema verified (started_at, completed_at, scheduled_start_time, user_email)");
            } catch (Exception e) {
                System.out.println("⚠️ Could not verify schema: " + e.getMessage());
            }
        };
    }
    public static void main(String[] args) {
        // Load .env BEFORE Spring context starts
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")
                    .ignoreIfMissing()
                    .load();

            dotenv.entries().forEach(entry -> {
                if (System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception e) {
            System.out.println("Warning: Could not load .env file: " + e.getMessage());
        }

        SpringApplication.run(TaskManagerApplication.class, args);
    }
}
