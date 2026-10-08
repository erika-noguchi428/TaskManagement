// タスクを移動した後の一覧を返す(画面の先行更新用)。バックエンドの並び順の振り直しと同じ規則。
// position: 移動先の列(自分を除く)での0始まりの挿入位置。省略すると末尾。
// 移動しても配置が変わらない場合は null を返す。
export function moveTaskLocally(tasks, taskId, status, position) {
  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null

  const column = tasks
    .filter((t) => t.status === status && t.id !== taskId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const index = position === undefined ? column.length : Math.min(position, column.length)
  column.splice(index, 0, task)

  const orderById = new Map(column.map((t, i) => [t.id, i + 1]))
  if (task.status === status && orderById.get(taskId) === task.sortOrder) return null

  return tasks.map((t) => {
    if (t.id === taskId) return { ...t, status, sortOrder: orderById.get(t.id) }
    return orderById.has(t.id) ? { ...t, sortOrder: orderById.get(t.id) } : t
  })
}
