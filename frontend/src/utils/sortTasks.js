import { PRIORITY_OPTIONS } from './priority'

export const COLUMN_SORTS = [
  { key: 'priority', label: '重要度順' },
  { key: 'dueDate', label: '期日順' },
]

function priorityRank(task) {
  const index = PRIORITY_OPTIONS.indexOf(task.priority)
  return index === -1 ? PRIORITY_OPTIONS.length : index
}

// 期日なしは末尾。YYYY-MM-DD形式なので文字列比較で日付順になる。
function compareDueDate(a, b) {
  if (a.dueDate === b.dueDate) return 0
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  return a.dueDate < b.dueDate ? -1 : 1
}

// 重要度は高→低、期日は近い順。同順位の場合は もう一方の項目 → 元の並びの順で決める。
export function sortTasks(tasks, sortKey) {
  if (sortKey === 'priority') {
    return [...tasks].sort((a, b) => priorityRank(a) - priorityRank(b) || compareDueDate(a, b))
  }
  if (sortKey === 'dueDate') {
    return [...tasks].sort((a, b) => compareDueDate(a, b) || priorityRank(a) - priorityRank(b))
  }
  return tasks
}
