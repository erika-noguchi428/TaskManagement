package com.taskmanagement.backend.service;

import com.taskmanagement.backend.dto.TaskCreateRequest;
import com.taskmanagement.backend.dto.TaskMoveRequest;
import com.taskmanagement.backend.dto.TaskResponse;
import com.taskmanagement.backend.dto.TaskUpdateRequest;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class TaskService {

    private static final int MAX_TITLE_LENGTH = 255;

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

    @Transactional
    public TaskResponse create(TaskCreateRequest request) {
        if (request == null) {
            throw new InvalidRequestException("title is required");
        }
        String title = validateTitle(request.title());
        Priority priority = validatePriority(request.priority());

        // 新規タスクは「未着手」列の末尾に追加する。IDはDB(IDENTITY)が自動採番する。
        int sortOrder = taskRepository.findMaxSortOrderByStatus(Status.NOT_STARTED) + 1;
        Task saved = taskRepository.save(
                Task.create(title, request.description(), priority, request.dueDate(), sortOrder));
        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse update(Long id, TaskUpdateRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        if (request == null) {
            throw new InvalidRequestException("title is required");
        }
        String title = validateTitle(request.title());
        Priority priority = validatePriority(request.priority());
        Status newStatus = parseStatus(request.status());

        task.update(title, request.description(), priority, request.dueDate());
        if (newStatus != null && newStatus != task.getStatus()) {
            // 別の列へ移動した場合は、移動先の列の末尾に配置する。
            task.moveTo(newStatus, taskRepository.findMaxSortOrderByStatus(newStatus) + 1);
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    // 物理削除。列内の並び順は相対順序のみが意味を持つため、欠番が出ても振り直さない。
    @Transactional
    public void delete(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse move(Long id, TaskMoveRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        Status targetStatus = request == null ? null : parseStatus(request.status());
        if (targetStatus == null) {
            targetStatus = task.getStatus();
        }
        Integer requested = request == null ? null : request.position();
        if (requested != null && requested < 0) {
            throw new InvalidRequestException("position must be 0 or greater");
        }

        // 移動先の列から自分自身を除いた並びに挿入し、1からの連番に振り直す。
        List<Task> column = new ArrayList<>(taskRepository.findByStatusOrderBySortOrderAscIdAsc(targetStatus));
        column.removeIf(t -> t == task || Objects.equals(t.getId(), id));
        int position = requested == null ? column.size() : Math.min(requested, column.size());
        column.add(position, task);

        for (int i = 0; i < column.size(); i++) {
            Task t = column.get(i);
            int order = i + 1;
            if (t == task && t.getStatus() != targetStatus) {
                t.moveTo(targetStatus, order);
            } else if (!t.getSortOrder().equals(order)) {
                t.reorder(order);
            }
        }
        taskRepository.saveAll(column);
        return TaskResponse.from(task);
    }

    private String validateTitle(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidRequestException("title is required");
        }
        String title = raw.strip();
        if (title.length() > MAX_TITLE_LENGTH) {
            throw new InvalidRequestException("title must be at most " + MAX_TITLE_LENGTH + " characters");
        }
        return title;
    }

    private Priority validatePriority(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new InvalidRequestException("priority is required. Allowed values: 高, 中, 低");
        }
        return parsePriority(raw);
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
