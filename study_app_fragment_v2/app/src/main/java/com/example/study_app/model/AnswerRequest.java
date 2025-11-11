package com.example.study_app.model;

public class AnswerRequest {
    private int questionId;
    private int userId;
    private String content;

    public AnswerRequest(int questionId, int userId, String content) {
        this.questionId = questionId;
        this.userId = userId;
        this.content = content;
    }

    // Getters
    public int getQuestionId() { return questionId; }
    public int getUserId() { return userId; }
    public String getContent() { return content; }

    // Setters
    public void setQuestionId(int questionId) { this.questionId = questionId; }
    public void setUserId(int userId) { this.userId = userId; }
    public void setContent(String content) { this.content = content; }
}
