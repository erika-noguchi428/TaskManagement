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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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
    void deletePhysicallyRemovesExistingTask() {
        Task task = Task.create("削除対象", null, Priority.MEDIUM, null, 1);
        when(taskRepository.findById(3L)).thenReturn(Optional.of(task));

        taskService.delete(3L);

        verify(taskRepository).delete(task);
    }

    @Test
    void deleteThrowsNotFoundForUnknownId() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(99L)).isInstanceOf(TaskNotFoundException.class);
        verify(taskRepository, never()).delete(any(Task.class));
    }

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

    private Task existingTask() {
        return Task.create("旧タイトル", "旧説明", Priority.LOW, null, 2);
    }

    @Test
    void updateReplacesAllFieldsAndKeepsStatusWhenOmitted() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask()));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.update(1L,
                new TaskUpdateRequest("  新タイトル  ", "新説明", "高", LocalDate.of(2026, 11, 1), null));

        assertThat(response.title()).isEqualTo("新タイトル");
        assertThat(response.description()).isEqualTo("新説明");
        assertThat(response.priority()).isEqualTo("高");
        assertThat(response.dueDate()).isEqualTo(LocalDate.of(2026, 11, 1));
        assertThat(response.status()).isEqualTo("未着手");
        assertThat(response.sortOrder()).isEqualTo(2);
    }

    @Test
    void updateMovesToEndOfNewColumnWhenStatusChanges() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask()));
        when(taskRepository.findMaxSortOrderByStatus(Status.DONE)).thenReturn(7);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.update(1L,
                new TaskUpdateRequest("t", null, "中", null, "完了"));

        assertThat(response.status()).isEqualTo("完了");
        assertThat(response.sortOrder()).isEqualTo(8);
    }

    @Test
    void updateThrowsNotFoundForUnknownId() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> taskService.update(99L, new TaskUpdateRequest("t", null, "中", null, null)))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void updateRejectsInvalidInput() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask()));
        assertThatThrownBy(() -> taskService.update(1L, new TaskUpdateRequest(" ", null, "中", null, null)))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> taskService.update(1L, new TaskUpdateRequest("t", null, "最高", null, null)))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> taskService.update(1L, new TaskUpdateRequest("t", null, "中", null, "不明")))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).save(any());
    }

    private Task taskWithId(long id, String title, Status status, int sortOrder) {
        Task task = Task.create(title, null, Priority.MEDIUM, null, sortOrder);
        ReflectionTestUtils.setField(task, "id", id);
        if (status != Status.NOT_STARTED) {
            task.moveTo(status, sortOrder);
        }
        return task;
    }

    @Test
    void moveReordersWithinSameColumnWithoutChangingContent() {
        Task a = taskWithId(1, "A", Status.NOT_STARTED, 1);
        Task b = taskWithId(2, "B", Status.NOT_STARTED, 2);
        Task c = taskWithId(3, "C", Status.NOT_STARTED, 3);
        when(taskRepository.findById(3L)).thenReturn(Optional.of(c));
        when(taskRepository.findByStatusOrderBySortOrderAscIdAsc(Status.NOT_STARTED))
                .thenReturn(List.of(a, b, c));

        TaskResponse response = taskService.move(3L, new TaskMoveRequest(null, 0));

        assertThat(response.sortOrder()).isEqualTo(1);
        assertThat(response.title()).isEqualTo("C");
        assertThat(a.getSortOrder()).isEqualTo(2);
        assertThat(b.getSortOrder()).isEqualTo(3);
        assertThat(c.getStatus()).isEqualTo(Status.NOT_STARTED);
        verify(taskRepository).saveAll(any());
    }

    @Test
    void moveToAnotherColumnInsertsAtPosition() {
        Task a = taskWithId(1, "A", Status.NOT_STARTED, 1);
        Task x = taskWithId(10, "X", Status.IN_PROGRESS, 1);
        Task y = taskWithId(11, "Y", Status.IN_PROGRESS, 2);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(a));
        when(taskRepository.findByStatusOrderBySortOrderAscIdAsc(Status.IN_PROGRESS))
                .thenReturn(List.of(x, y));

        TaskResponse response = taskService.move(1L, new TaskMoveRequest("作業中", 1));

        assertThat(response.status()).isEqualTo("作業中");
        assertThat(response.sortOrder()).isEqualTo(2);
        assertThat(x.getSortOrder()).isEqualTo(1);
        assertThat(y.getSortOrder()).isEqualTo(3);
    }

    @Test
    void moveWithoutPositionAppendsToEnd() {
        Task a = taskWithId(1, "A", Status.NOT_STARTED, 1);
        Task b = taskWithId(2, "B", Status.NOT_STARTED, 2);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(a));
        when(taskRepository.findByStatusOrderBySortOrderAscIdAsc(Status.NOT_STARTED))
                .thenReturn(List.of(a, b));

        TaskResponse response = taskService.move(1L, new TaskMoveRequest(null, null));

        assertThat(response.sortOrder()).isEqualTo(2);
        assertThat(b.getSortOrder()).isEqualTo(1);
    }

    @Test
    void moveRejectsUnknownTaskNegativePositionAndInvalidStatus() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> taskService.move(99L, new TaskMoveRequest(null, 0)))
                .isInstanceOf(TaskNotFoundException.class);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask()));
        assertThatThrownBy(() -> taskService.move(1L, new TaskMoveRequest(null, -1)))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> taskService.move(1L, new TaskMoveRequest("不明", 0)))
                .isInstanceOf(InvalidRequestException.class);
        verify(taskRepository, never()).saveAll(any());
    }
}
