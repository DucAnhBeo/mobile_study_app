package com.example.study_app.model;

public class QuestionRequest {
    private int userId;
    private String content;

    public QuestionRequest(int userId, String content) {
        this.userId = userId;
        this.content = content;
    }

    // Getters
    public int getUserId() { return userId; }
    public String getContent() { return content; }

    // Setters
    public void setUserId(int userId) { this.userId = userId; }
    public void setContent(String content) { this.content = content; }
}
