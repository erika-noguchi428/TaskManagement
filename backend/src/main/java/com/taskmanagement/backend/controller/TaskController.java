package com.taskmanagement.backend.controller;

import com.taskmanagement.backend.dto.TaskCreateRequest;
import com.taskmanagement.backend.dto.TaskResponse;
import com.taskmanagement.backend.dto.TaskUpdateRequest;
import com.taskmanagement.backend.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> getTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort
    ) {
        return taskService.search(status, priority, keyword, sort);
    }

    @GetMapping("/{id}")
    public TaskResponse getTask(@PathVariable Long id) {
        return taskService.getById(id);
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @RequestBody TaskUpdateRequest request) {
        return taskService.update(id, request);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@RequestBody TaskCreateRequest request) {
        TaskResponse created = taskService.create(request);
        return ResponseEntity.created(URI.create("/api/tasks/" + created.id())).body(created);
    }
}
