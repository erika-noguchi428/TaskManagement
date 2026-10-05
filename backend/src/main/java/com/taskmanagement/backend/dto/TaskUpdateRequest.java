package com.taskmanagement.backend.dto;

import java.time.LocalDate;

/**
 * タスク更新リクエスト(PUT)。タイトル・説明文・優先度・期限は全項目を置き換える。
 * statusは省略可能で、省略した場合は現在のステータスを維持する。
 */
public record TaskUpdateRequest(
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        String status
) {
}
