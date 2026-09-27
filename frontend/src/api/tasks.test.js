import { describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { fetchTasks } from './tasks'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn() },
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
