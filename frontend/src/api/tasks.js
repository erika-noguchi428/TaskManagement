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
