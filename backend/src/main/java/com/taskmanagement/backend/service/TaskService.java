package com.taskmanagement.backend.service;

import com.taskmanagement.backend.dto.TaskResponse;
import com.taskmanagement.backend.entity.Priority;
import com.taskmanagement.backend.entity.Status;
import com.taskmanagement.backend.entity.Task;
import com.taskmanagement.backend.exception.InvalidRequestException;
import com.taskmanagement.backend.exception.TaskNotFoundException;
import com.taskmanagement.backend.repository.TaskRepository;
import com.taskmanagement.backend.repository.TaskSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> search(String statusParam, String priorityParam, String keyword, String sortParam) {
        Status status = parseStatus(statusParam);
        Priority priority = parsePriority(priorityParam);

        Specification<Task> filters = Specification
                .where(TaskSpecifications.hasStatus(status))
                .and(TaskSpecifications.hasPriority(priority))
                .and(TaskSpecifications.keywordContains(keyword));

        List<Task> tasks;
        if (sortParam == null || sortParam.isBlank()) {
            tasks = taskRepository.findAll(filters, Sort.by(Sort.Direction.ASC, "id"));
        } else {
            SortRequest sortRequest = parseSort(sortParam);
            Specification<Task> withOrder = filters.and(
                    sortRequest.field() == SortField.PRIORITY
                            ? TaskSpecifications.orderByPriority(sortRequest.ascending())
                            : TaskSpecifications.orderByDueDate(sortRequest.ascending())
            );
            tasks = taskRepository.findAll(withOrder);
        }

        return tasks.stream().map(TaskResponse::from).toList();
    }

    public TaskResponse getById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        return TaskResponse.from(task);
    }

    private Status parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Status.fromLabel(raw);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException(
                    "Invalid status value: '" + raw + "'. Allowed values: 未着手, 作業中, 完了");
        }
    }

    private Priority parsePriority(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Priority.fromLabel(raw);
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException(
                    "Invalid priority value: '" + raw + "'. Allowed values: 高, 中, 低");
        }
    }

    private SortRequest parseSort(String raw) {
        String[] parts = raw.split(",");
        if (parts.length != 2) {
            throw new InvalidRequestException(
                    "Invalid sort format: '" + raw + "'. Expected '<field>,<asc|desc>', e.g. 'priority,asc'");
        }
        SortField field = switch (parts[0].trim()) {
            case "priority" -> SortField.PRIORITY;
            case "dueDate" -> SortField.DUE_DATE;
            default -> throw new InvalidRequestException(
                    "Invalid sort field: '" + parts[0] + "'. Allowed values: priority, dueDate");
        };
        boolean ascending = switch (parts[1].trim().toLowerCase()) {
            case "asc" -> true;
            case "desc" -> false;
            default -> throw new InvalidRequestException(
                    "Invalid sort direction: '" + parts[1] + "'. Allowed values: asc, desc");
        };
        return new SortRequest(field, ascending);
    }

    private enum SortField {
        PRIORITY, DUE_DATE
    }

    private record SortRequest(SortField field, boolean ascending) {
    }
}
