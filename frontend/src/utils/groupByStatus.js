export const STATUSES = ['未着手', '作業中', '完了']

export function groupByStatus(tasks) {
  const grouped = { 未着手: [], 作業中: [], 完了: [] }
  for (const task of tasks) {
    grouped[task.status]?.push(task)
  }
  return grouped
}

export function orderForColumn(tasksForStatus, sortParam) {
  if (sortParam) return tasksForStatus
  return [...tasksForStatus].sort((a, b) => a.sortOrder - b.sortOrder)
}
