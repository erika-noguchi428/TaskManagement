package com.taskmanagement.backend.repository;

import com.taskmanagement.backend.entity.Priority;
import com.taskmanagement.backend.entity.Status;
import com.taskmanagement.backend.entity.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Rolled back with the rest of each test's transaction (@DataJpaTest default),
    // so this never touches data left by a manually seeded (non-test) DB permanently.
    @BeforeEach
    void clearExistingRows() {
        jdbcTemplate.update("DELETE FROM tasks");
    }

    private void insertTask(String title, String description, String priority, String dueDate, String status) {
        jdbcTemplate.update(
                "INSERT INTO tasks (title, description, priority, due_date, status, sort_order, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?::date, ?, 1, now(), now())",
                title, description, priority, dueDate, status);
    }

    @Test
    void filtersByStatusPriorityAndKeywordCombinedWithAnd() {
        insertTask("高優先度タスク", "説明A", "高", "2026-01-10", "未着手");
        insertTask("中優先度タスク", "説明B", "中", "2026-01-11", "未着手");
        insertTask("完了済みタスク", "説明C", "高", "2026-01-12", "完了");

        Specification<Task> spec = Specification
                .where(TaskSpecifications.hasStatus(Status.NOT_STARTED))
                .and(TaskSpecifications.hasPriority(Priority.HIGH))
                .and(TaskSpecifications.keywordContains("高優先度"));

        List<Task> result = taskRepository.findAll(spec);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("高優先度タスク");
    }

    @Test
    void keywordSearchIsCaseInsensitiveAndMatchesTitleOrDescription() {
        insertTask("Docker設定", "コンテナの定義", "中", null, "未着手");
        insertTask("その他タスク", "dockerイメージのビルド", "中", null, "未着手");
        insertTask("無関係タスク", "説明", "中", null, "未着手");

        Specification<Task> spec = TaskSpecifications.keywordContains("DOCKER");
        List<Task> result = taskRepository.findAll(spec);

        assertThat(result).hasSize(2);
    }

    @Test
    void ordersByPriorityRankNotAlphabetically() {
        insertTask("低タスク", null, "低", null, "未着手");
        insertTask("高タスク", null, "高", null, "未着手");
        insertTask("中タスク", null, "中", null, "未着手");

        List<Task> result = taskRepository.findAll(TaskSpecifications.orderByPriority(true));

        assertThat(result).extracting(Task::getPriority)
                .containsExactly(Priority.HIGH, Priority.MEDIUM, Priority.LOW);
    }

    @Test
    void ordersByDueDateAscending() {
        insertTask("期限なし", null, "中", null, "未着手");
        insertTask("近い期限", null, "中", "2026-01-01", "未着手");
        insertTask("遠い期限", null, "中", "2026-06-01", "未着手");

        List<Task> result = taskRepository.findAll(TaskSpecifications.orderByDueDate(true));

        assertThat(result).extracting(Task::getTitle)
                .containsSubsequence("近い期限", "遠い期限");
    }

    @Test
    void findsById() {
        insertTask("単体取得対象", null, "中", null, "未着手");
        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM tasks ORDER BY id DESC LIMIT 1", Long.class);

        assertThat(taskRepository.findById(id)).isPresent();
        assertThat(taskRepository.findAll(Sort.by("id"))).isNotEmpty();
    }

    @Test
    void assignsIncrementingIdsOnSave() {
        Task first = taskRepository.saveAndFlush(
                Task.create("1件目", null, Priority.MEDIUM, null, 1));
        Task second = taskRepository.saveAndFlush(
                Task.create("2件目", null, Priority.HIGH, null, 2));

        assertThat(first.getId()).isNotNull();
        assertThat(second.getId()).isGreaterThan(first.getId());
        assertThat(first.getStatus()).isEqualTo(Status.NOT_STARTED);
    }

    @Test
    void findsMaxSortOrderPerStatusOrZeroWhenEmpty() {
        assertThat(taskRepository.findMaxSortOrderByStatus(Status.NOT_STARTED)).isZero();

        insertTask("未着手A", null, "中", null, "未着手");
        jdbcTemplate.update("UPDATE tasks SET sort_order = 5 WHERE title = '未着手A'");
        insertTask("完了A", null, "中", null, "完了");
        jdbcTemplate.update("UPDATE tasks SET sort_order = 9 WHERE title = '完了A'");

        assertThat(taskRepository.findMaxSortOrderByStatus(Status.NOT_STARTED)).isEqualTo(5);
    }
}
