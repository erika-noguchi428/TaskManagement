package com.taskmanagement.backend.service;

import com.taskmanagement.backend.dto.TaskCreateRequest;
import com.taskmanagement.backend.dto.TaskResponse;
import com.taskmanagement.backend.entity.Status;
import com.taskmanagement.backend.entity.Task;
import com.taskmanagement.backend.exception.InvalidRequestException;
import com.taskmanagement.backend.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createAppendsToEndOfNotStartedColumnWithNotStartedStatus() {
        when(taskRepository.findMaxSortOrderByStatus(Status.NOT_STARTED)).thenReturn(4);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.create(
                new TaskCreateRequest("  新規タスク  ", "説明", "中", LocalDate.of(2026, 10, 31)));

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        Task saved = captor.getValue();
        assertThat(saved.getTitle()).isEqualTo("新規タスク");
        assertThat(saved.getSortOrder()).isEqualTo(5);
        assertThat(saved.getStatus()).isEqualTo(Status.NOT_STARTED);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(response.status()).isEqualTo("未着手");
        assertThat(response.priority()).isEqualTo("中");
    }

    @Test
    void createRejectsBlankTitle() {
        assertThatThrownBy(() -> taskService.create(new TaskCreateRequest("  ", null, "高", null)))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).save(any());
    }

    @Test
    void createRejectsTooLongTitle() {
        assertThatThrownBy(() -> taskService.create(
                new TaskCreateRequest("a".repeat(256), null, "高", null)))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void createRejectsMissingOrUnknownPriority() {
        assertThatThrownBy(() -> taskService.create(new TaskCreateRequest("t", null, null, null)))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> taskService.create(new TaskCreateRequest("t", null, "最高", null)))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).save(any());
    }
}
