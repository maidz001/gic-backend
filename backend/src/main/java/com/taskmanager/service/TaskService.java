package com.taskmanager.service;

import com.taskmanager.model.Task;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.Array;
import java.sql.Connection;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class TaskService {

    private final JdbcTemplate jdbcTemplate;

    public TaskService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Task> taskRowMapper = (rs, rowNum) -> {
        Task task = new Task();
        task.setId(UUID.fromString(rs.getString("id")));
        task.setUserId(UUID.fromString(rs.getString("user_id")));
        task.setUserEmail(rs.getString("user_email"));
        task.setTitle(rs.getString("title"));
        task.setDescription(rs.getString("description"));
        task.setStatus(rs.getString("status"));
        task.setPriority(rs.getString("priority"));

        Timestamp deadline = rs.getTimestamp("deadline");
        if (deadline != null) {
            task.setDeadline(deadline.toInstant().atOffset(java.time.ZoneOffset.UTC));
        }

        Array tagsArray = rs.getArray("tags");
        if (tagsArray != null) {
            String[] tags = (String[]) tagsArray.getArray();
            task.setTags(Arrays.asList(tags));
        } else {
            task.setTags(List.of());
        }

        task.setCreatedAt(rs.getTimestamp("created_at").toInstant().atOffset(java.time.ZoneOffset.UTC));

        Timestamp startedAt = rs.getTimestamp("started_at");
        if (startedAt != null) {
            task.setStartedAt(startedAt.toInstant().atOffset(java.time.ZoneOffset.UTC));
        }

        Timestamp completedAt = rs.getTimestamp("completed_at");
        if (completedAt != null) {
            task.setCompletedAt(completedAt.toInstant().atOffset(java.time.ZoneOffset.UTC));
        }

        Timestamp scheduledStartTime = rs.getTimestamp("scheduled_start_time");
        if (scheduledStartTime != null) {
            task.setScheduledStartTime(scheduledStartTime.toInstant().atOffset(java.time.ZoneOffset.UTC));
        }

        return task;
    };

    public List<Task> getTasksByUser(UUID userId) {
        return jdbcTemplate.query(
            "SELECT * FROM tasks WHERE user_id = ?::uuid ORDER BY created_at DESC",
            taskRowMapper, userId.toString()
        );
    }

    public Task createTask(Task task) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.execute((Connection conn) -> {
            String sql = "INSERT INTO tasks (id, user_id, title, description, status, priority, deadline, tags, scheduled_start_time, user_email) " +
                         "VALUES (?::uuid, ?::uuid, ?, ?, ?::task_status, ?::task_priority, ?, ?, ?, ?)";
            var ps = conn.prepareStatement(sql);
            ps.setString(1, id.toString());
            ps.setString(2, task.getUserId().toString());
            ps.setString(3, task.getTitle());
            ps.setString(4, task.getDescription() != null ? task.getDescription() : "");
            ps.setString(5, task.getStatus() != null ? task.getStatus() : "TODO");
            ps.setString(6, task.getPriority() != null ? task.getPriority() : "MEDIUM");
            if (task.getDeadline() != null) {
                ps.setTimestamp(7, Timestamp.from(task.getDeadline().toInstant()));
            } else {
                ps.setNull(7, java.sql.Types.TIMESTAMP);
            }
            String[] tagsArr = (task.getTags() != null && !task.getTags().isEmpty())
                    ? task.getTags().toArray(new String[0]) : new String[]{};
            ps.setArray(8, conn.createArrayOf("text", tagsArr));
            if (task.getScheduledStartTime() != null) {
                ps.setTimestamp(9, Timestamp.from(task.getScheduledStartTime().toInstant()));
            } else {
                ps.setNull(9, java.sql.Types.TIMESTAMP);
            }
            ps.setString(10, task.getUserEmail());
            ps.executeUpdate();
            ps.close();
            return null;
        });
        task.setId(id);
        return task;
    }

    public void updateTaskStatus(UUID taskId, UUID userId, String status) {
        jdbcTemplate.update(
            "UPDATE tasks SET status = ?::task_status, " +
            "started_at = CASE WHEN ? = 'IN_PROGRESS' AND started_at IS NULL THEN NOW() ELSE started_at END, " +
            "completed_at = CASE WHEN ? = 'DONE' THEN NOW() ELSE NULL END " +
            "WHERE id = ?::uuid AND user_id = ?::uuid",
            status, status, status, taskId.toString(), userId.toString()
        );
    }

    public void updateTask(UUID taskId, UUID userId, Task task) {
        jdbcTemplate.execute((Connection conn) -> {
            String sql = "UPDATE tasks SET title=?, description=?, priority=?::task_priority, deadline=?, tags=?, scheduled_start_time=? " +
                         "WHERE id=?::uuid AND user_id=?::uuid";
            var ps = conn.prepareStatement(sql);
            ps.setString(1, task.getTitle());
            ps.setString(2, task.getDescription() != null ? task.getDescription() : "");
            ps.setString(3, task.getPriority());
            if (task.getDeadline() != null) {
                ps.setTimestamp(4, Timestamp.from(task.getDeadline().toInstant()));
            } else {
                ps.setNull(4, java.sql.Types.TIMESTAMP);
            }
            String[] tagsArr = (task.getTags() != null && !task.getTags().isEmpty())
                    ? task.getTags().toArray(new String[0]) : new String[]{};
            ps.setArray(5, conn.createArrayOf("text", tagsArr));
            if (task.getScheduledStartTime() != null) {
                ps.setTimestamp(6, Timestamp.from(task.getScheduledStartTime().toInstant()));
            } else {
                ps.setNull(6, java.sql.Types.TIMESTAMP);
            }
            ps.setString(7, taskId.toString());
            ps.setString(8, userId.toString());
            ps.executeUpdate();
            ps.close();
            return null;
        });
    }

    public void deleteTask(UUID taskId, UUID userId) {
        jdbcTemplate.update(
            "DELETE FROM tasks WHERE id = ?::uuid AND user_id = ?::uuid",
            taskId.toString(), userId.toString()
        );
    }

    public List<Task> getTasksWithUpcomingDeadlines() {
        return jdbcTemplate.query(
            "SELECT * FROM tasks WHERE deadline IS NOT NULL " +
            "AND deadline BETWEEN NOW() AND NOW() + INTERVAL '24 hours' AND status != 'DONE'",
            taskRowMapper
        );
    }

    public List<Task> getTasksWithDeadlinesIn30Mins() {
        return jdbcTemplate.query(
            "SELECT * FROM tasks WHERE deadline IS NOT NULL " +
            "AND deadline > NOW() + INTERVAL '29 minutes' AND deadline <= NOW() + INTERVAL '30 minutes' AND status != 'DONE'",
            taskRowMapper
        );
    }

    public List<Task> getTasksByUserForAI(UUID userId) {
        return jdbcTemplate.query(
            "SELECT * FROM tasks WHERE user_id = ?::uuid AND status != 'DONE' " +
            "ORDER BY priority DESC, deadline ASC NULLS LAST",
            taskRowMapper, userId.toString()
        );
    }

    // Dùng bởi ChatService để lấy tóm tắt tasks cho AI context
    public String getTasksSummary(String userId) {
        try {
            List<String> summaries = jdbcTemplate.query(
                "SELECT title, status, priority, deadline, id FROM tasks WHERE user_id = ?::uuid AND status != 'DONE' " +
                "ORDER BY priority DESC, deadline ASC NULLS LAST LIMIT 20",
                (rs, i) -> String.format("- %s [ID: %s, %s/%s] deadline: %s",
                    rs.getString("title"),
                    rs.getString("id"),
                    rs.getString("status"),
                    rs.getString("priority"),
                    rs.getTimestamp("deadline") != null ? rs.getTimestamp("deadline").toString() : "Không có"
                ),
                userId
            );
            return summaries.isEmpty() ? "Không có task nào." : String.join("\n", summaries);
        } catch (Exception e) {
            return "Không lấy được danh sách task.";
        }
    }

    public List<Task> autoStartScheduledTasks() {
        List<Task> tasksToStart = jdbcTemplate.query(
            "SELECT * FROM tasks WHERE status = 'TODO' AND scheduled_start_time IS NOT NULL AND scheduled_start_time <= NOW()",
            taskRowMapper
        );
        if (!tasksToStart.isEmpty()) {
            jdbcTemplate.update(
                "UPDATE tasks SET status = 'IN_PROGRESS', started_at = NOW() WHERE status = 'TODO' AND scheduled_start_time IS NOT NULL AND scheduled_start_time <= NOW()"
            );
        }
        return tasksToStart;
    }
}
