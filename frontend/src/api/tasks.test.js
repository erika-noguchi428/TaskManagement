import { describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { createTask, fetchTasks, moveTask, updateTask } from './tasks'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
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

describe('updateTask', () => {
  it('puts all fields to the task URL, sending null for cleared optional fields', async () => {
    apiClient.put.mockResolvedValue({ data: { id: 3 } })

    const result = await updateTask(3, {
      title: '更新',
      description: '',
      priority: '高',
      dueDate: '',
      status: '作業中',
    })

    expect(apiClient.put).toHaveBeenCalledWith('/api/tasks/3', {
      title: '更新',
      description: null,
      priority: '高',
      dueDate: null,
      status: '作業中',
    })
    expect(result).toEqual({ id: 3 })
  })
})

describe('moveTask', () => {
  it('puts only status and position to the move URL', async () => {
    apiClient.put.mockResolvedValue({ data: { id: 3 } })

    await moveTask(3, { status: '作業中', position: 0 })

    expect(apiClient.put).toHaveBeenCalledWith('/api/tasks/3/move', { status: '作業中', position: 0 })
  })

  it('omits position when not given', async () => {
    apiClient.put.mockResolvedValue({ data: { id: 3 } })

    await moveTask(3, { status: '完了' })

    expect(apiClient.put).toHaveBeenCalledWith('/api/tasks/3/move', { status: '完了' })
  })
})
