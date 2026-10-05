package com.taskmanagement.backend.controller;

import com.taskmanagement.backend.dto.TaskCreateRequest;
import com.taskmanagement.backend.dto.TaskResponse;
import com.taskmanagement.backend.exception.InvalidRequestException;
import com.taskmanagement.backend.exception.TaskNotFoundException;
import com.taskmanagement.backend.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    private TaskResponse sampleTask() {
        return new TaskResponse(1L, "サンプルタスク", "説明", "高",
                LocalDate.of(2026, 9, 30), "未着手", 1,
                LocalDateTime.of(2026, 9, 1, 9, 0), LocalDateTime.of(2026, 9, 1, 9, 0));
    }

    @Test
    void getTasksReturnsList() throws Exception {
        when(taskService.search(isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(sampleTask()));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("サンプルタスク"))
                .andExpect(jsonPath("$[0].priority").value("高"));
    }

    @Test
    void getTaskByIdReturnsTask() throws Exception {
        when(taskService.getById(1L)).thenReturn(sampleTask());

        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getTaskByIdReturns404WhenNotFound() throws Exception {
        when(taskService.getById(999L)).thenThrow(new TaskNotFoundException(999L));

        mockMvc.perform(get("/api/tasks/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getTasksReturns400ForInvalidStatus() throws Exception {
        when(taskService.search(eq("invalid"), any(), any(), any()))
                .thenThrow(new InvalidRequestException("Invalid status value: 'invalid'"));

        mockMvc.perform(get("/api/tasks").param("status", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getTaskByIdReturns400ForNonNumericId() throws Exception {
        mockMvc.perform(get("/api/tasks/abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTaskReturns201WithLocationAndGeneratedId() throws Exception {
        when(taskService.create(any(TaskCreateRequest.class))).thenReturn(sampleTask());

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"サンプルタスク","description":"説明","priority":"高","dueDate":"2026-09-30"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tasks/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("未着手"));
    }

    @Test
    void createTaskReturns400WhenServiceRejectsRequest() throws Exception {
        when(taskService.create(any(TaskCreateRequest.class)))
                .thenThrow(new InvalidRequestException("title is required"));

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"priority\":\"高\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createTaskReturns400ForMalformedBody() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\",\"priority\":\"高\",\"dueDate\":\"not-a-date\"}"))
                .andExpect(status().isBadRequest());
    }
}
