package com.example.study_app.data;

import com.example.study_app.model.AuthResponse;
import com.example.study_app.model.LoginRequest;
import com.example.study_app.model.UpdateProfileRequest;
import com.example.study_app.model.DiscussionResponse;
import com.example.study_app.model.QuestionRequest;
import com.example.study_app.model.AnswerRequest;
import com.example.study_app.model.GoogleSignInRequest;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface AuthAPI {
    // Auth endpoints
    @POST("api/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("api/register")
    Call<AuthResponse> register(@Body LoginRequest request);

    @POST("api/auth/google")
    Call<AuthResponse> googleLogin(@Body GoogleSignInRequest request);

    @PUT("api/profile/{userId}")
    Call<AuthResponse> updateProfile(@Path("userId") int userId, @Body UpdateProfileRequest request);

    // Discussion endpoints
    @GET("api/questions")
    Call<DiscussionResponse> getDiscussions();

    @POST("api/questions")
    Call<AuthResponse> createQuestion(@Body QuestionRequest request);

    @POST("api/answers")
    Call<AuthResponse> createAnswer(@Body AnswerRequest request);

    @DELETE("api/questions/{questionId}")
    Call<AuthResponse> deleteQuestion(@Path("questionId") int questionId, @Query("user_id") int userId);
}
