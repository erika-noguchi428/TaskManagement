package com.taskmanagement.backend.dto;

import java.time.LocalDate;

/**
 * タスク登録リクエスト。IDは受け取らない(DBで自動採番)。
 * ステータスは常に「未着手」で登録されるため、ここにも含めない。
 */
public record TaskCreateRequest(
        String title,
        String description,
        String priority,
        LocalDate dueDate
) {
}
