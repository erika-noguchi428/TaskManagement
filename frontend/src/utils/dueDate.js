const NEAR_DUE_THRESHOLD_DAYS = 3

const DUE_DATE_TEXT_CLASSES = {
  overdue: 'text-red-700 font-semibold',
  near: 'text-yellow-700 font-semibold',
  normal: 'text-gray-600',
}

function toMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getDueDateStatus(dueDate) {
  if (!dueDate) return null

  const today = toMidnight(new Date())
  const due = toMidnight(new Date(dueDate))
  const daysUntilDue = Math.round((due - today) / (24 * 60 * 60 * 1000))

  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= NEAR_DUE_THRESHOLD_DAYS) return 'near'
  return 'normal'
}

export function getDueDateClass(dueDate) {
  const status = getDueDateStatus(dueDate)
  return status ? DUE_DATE_TEXT_CLASSES[status] : ''
}
