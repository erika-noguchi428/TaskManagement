package com.taskmanagement.backend.dto;

/**
 * タスク移動リクエスト(PUT /api/tasks/{id}/move)。
 * statusは移動先のステータス(省略時は現在のまま)、positionは移動先の列での0始まりの挿入位置
 * (省略または列の件数以上の場合は末尾)。タスクの内容(タイトル等)は変更しない。
 */
public record TaskMoveRequest(
        String status,
        Integer position
) {
}
