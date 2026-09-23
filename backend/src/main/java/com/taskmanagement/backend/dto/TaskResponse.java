package com.taskmanagement.backend.dto;

import com.taskmanagement.backend.entity.Task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        String status,
        Integer sortOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority().getLabel(),
                task.getDueDate(),
                task.getStatus().getLabel(),
                task.getSortOrder(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
