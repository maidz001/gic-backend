package com.taskmanager.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Message {
    private String id;
    private String userId;
    private String taskId;
    private String content;
    private boolean isAi;
    private String createdAt;

    public Message() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    @JsonProperty("isAi")
    public boolean isAi() { return isAi; }

    @JsonProperty("isAi")
    public void setAi(boolean ai) { isAi = ai; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
