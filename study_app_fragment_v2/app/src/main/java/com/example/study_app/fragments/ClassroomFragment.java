package com.example.study_app.fragments;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.study_app.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ClassroomFragment extends Fragment {
    private ListView listToc;
    private Button btnToggleToc, btnBack;
    private WebView webViewLesson;

    private ArrayAdapter<String> tocAdapter;
    private final List<LessonItem> lessonItems = new ArrayList<>();

    private String jsonAssetPath;
    private String summarizeAssetPath;

    private boolean tocVisible = true;

    static class LessonItem {
        String title;
        String summarizeFile;
        boolean isChapter;

        LessonItem(String title, String summarizeFile, boolean isChapter) {
            this.title = title;
            this.summarizeFile = summarizeFile;
            this.isChapter = isChapter;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Ưu tiên arguments truyền vào
        if (getArguments() != null) {
            jsonAssetPath = getArguments().getString("jsonAssetPath");
            summarizeAssetPath = getArguments().getString("summarizeAssetPath");
        }

        // ✅ Nếu không có arguments, lấy từ SharedPreferences
        if (jsonAssetPath == null || summarizeAssetPath == null) {
            android.content.SharedPreferences prefs = requireContext()
                    .getSharedPreferences("classroom_data", 0);
            jsonAssetPath = prefs.getString("jsonAssetPath", null);
            summarizeAssetPath = prefs.getString("summarizeAssetPath", null);

            Log.d("ClassroomFragment", "Loaded from SharedPreferences:");
            Log.d("ClassroomFragment", "jsonAssetPath: " + jsonAssetPath);
            Log.d("ClassroomFragment", "summarizeAssetPath: " + summarizeAssetPath);
        }

        Log.d("Oidoidoi", "ClassroomFragment initialized with JSON: " + jsonAssetPath
                + " and summarize path: " + summarizeAssetPath);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {

        View view = inflater.inflate(R.layout.fragment_classroom, container, false);

        // Khởi tạo view đúng cách
        listToc = view.findViewById(R.id.listToc);
        btnToggleToc = view.findViewById(R.id.btnToggleToc);
        btnBack = view.findViewById(R.id.btnBack);
        webViewLesson = view.findViewById(R.id.webViewLesson);

        btnBack.setOnClickListener(v -> {
            // Pop back stack để quay về HomeFragment
            requireActivity().getSupportFragmentManager().popBackStack();

            // Cập nhật bottom navigation về Home
            if (getActivity() != null && getActivity().findViewById(R.id.buttonHome) != null) {
                getActivity().findViewById(R.id.buttonHome).performClick();
            }
        });        btnToggleToc.setOnClickListener(v -> toggleToc());

        webViewLesson.getSettings().setJavaScriptEnabled(true);

        return view;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        tocAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_list_item_1, new ArrayList<>());
        listToc.setAdapter(tocAdapter);
        // Nhấn vào mục trong danh sách
        listToc.setOnItemClickListener((parent, v, position, id) -> {
            LessonItem item = lessonItems.get(position);
            if (item.isChapter) return;

            if (item.summarizeFile == null || item.summarizeFile.isEmpty()) {
                Toast.makeText(getContext(), "Bài này chưa có nội dung.", Toast.LENGTH_SHORT).show();
                return;
            }

            String fullPath = "file:///android_asset/" + summarizeAssetPath + item.summarizeFile;
            webViewLesson.loadUrl(fullPath);
            toggleToc();
        });

        loadTocFromJson(jsonAssetPath);
    }

    private void toggleToc() {
        tocVisible = !tocVisible;
        if (tocVisible) {
            listToc.setVisibility(View.VISIBLE);
            webViewLesson.setVisibility(View.GONE);
            btnToggleToc.setText("Ẩn mục lục");
        } else {
            listToc.setVisibility(View.GONE);
            webViewLesson.setVisibility(View.VISIBLE);
            btnToggleToc.setText("Hiện mục lục");
        }
    }

    private void loadTocFromJson(String assetPath) {
        try (InputStream is = requireContext().getAssets().open(assetPath)) {
            String json = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))
                    .lines().collect(Collectors.joining());
            JSONObject root = new JSONObject(json);

            JSONArray chapters = root.optJSONArray("chapters");
            if (chapters == null) return;

            lessonItems.clear();
            List<String> displayList = new ArrayList<>();

            for (int i = 0; i < chapters.length(); i++) {
                JSONObject ch = chapters.getJSONObject(i);
                String chTitle = ch.optString("title", "Chương " + (i + 1));
                displayList.add(chTitle);
                lessonItems.add(new LessonItem(chTitle, null, true));

                JSONArray lessons = ch.optJSONArray("lessons");
                if (lessons == null) continue;

                for (int j = 0; j < lessons.length(); j++) {
                    JSONObject lesson = lessons.getJSONObject(j);
                    String lessonTitle = lesson.optString("title", "Bài " + (j + 1));
                    String summarizeFile = lesson.optString("summarize", "");
                    displayList.add("  • " + lessonTitle);
                    lessonItems.add(new LessonItem(lessonTitle, summarizeFile, false));
                }
            }

            tocAdapter.clear();
            tocAdapter.addAll(displayList);
            tocAdapter.notifyDataSetChanged();

        } catch (Exception e) {
            Toast.makeText(requireContext(), "Không thể tải mục lục.", Toast.LENGTH_LONG).show();
        }
    }
}
