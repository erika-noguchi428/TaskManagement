import { apiClient } from './client'

export async function fetchTasks({ status, priority, keyword, sort } = {}) {
  const params = {}
  if (status) params.status = status
  if (priority) params.priority = priority
  if (keyword) params.keyword = keyword
  if (sort) params.sort = sort

  const response = await apiClient.get('/api/tasks', { params })
  return response.data
}

export async function createTask({ title, description, priority, dueDate }) {
  const body = { title, priority }
  if (description) body.description = description
  if (dueDate) body.dueDate = dueDate

  const response = await apiClient.post('/api/tasks', body)
  return response.data
}

export async function updateTask(id, { title, description, priority, dueDate, status }) {
  const body = {
    title,
    description: description || null,
    priority,
    dueDate: dueDate || null,
    status,
  }

  const response = await apiClient.put(`/api/tasks/${id}`, body)
  return response.data
}

// 物理削除のため、削除したタスクは元に戻せない。
export async function deleteTask(id) {
  await apiClient.delete(`/api/tasks/${id}`)
}

// タスクの内容は変えず、ステータスと列内の位置(0始まり)だけを変更する。
export async function moveTask(id, { status, position }) {
  const body = { status }
  if (position !== undefined) body.position = position

  const response = await apiClient.put(`/api/tasks/${id}/move`, body)
  return response.data
}
