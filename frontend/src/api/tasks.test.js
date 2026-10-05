import { describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { createTask, fetchTasks } from './tasks'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('fetchTasks', () => {
  it('omits empty filter keys', async () => {
    apiClient.get.mockResolvedValue({ data: [] })

    await fetchTasks({})

    expect(apiClient.get).toHaveBeenCalledWith('/api/tasks', { params: {} })
  })

  it('builds params from non-empty filters', async () => {
    apiClient.get.mockResolvedValue({ data: [] })

    await fetchTasks({ keyword: 'foo', status: '未着手', priority: '高', sort: 'priority,asc' })

    expect(apiClient.get).toHaveBeenCalledWith('/api/tasks', {
      params: { keyword: 'foo', status: '未着手', priority: '高', sort: 'priority,asc' },
    })
  })

  it('returns the response data', async () => {
    const tasks = [{ id: 1, title: 'サンプル' }]
    apiClient.get.mockResolvedValue({ data: tasks })

    const result = await fetchTasks({})

    expect(result).toEqual(tasks)
  })
})

describe('createTask', () => {
  it('posts only the provided fields and returns the created task', async () => {
    apiClient.post.mockResolvedValue({ data: { id: 11, title: '新規' } })

    const result = await createTask({ title: '新規', description: '', priority: '高', dueDate: '' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/tasks', { title: '新規', priority: '高' })
    expect(result).toEqual({ id: 11, title: '新規' })
  })

  it('includes description and dueDate when given', async () => {
    apiClient.post.mockResolvedValue({ data: {} })

    await createTask({ title: 't', description: '説明', priority: '中', dueDate: '2026-12-01' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/tasks', {
      title: 't',
      priority: '中',
      description: '説明',
      dueDate: '2026-12-01',
    })
  })
})
