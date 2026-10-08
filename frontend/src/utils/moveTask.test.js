import { describe, expect, it } from 'vitest'
import { moveTaskLocally } from './moveTask'

const tasks = [
  { id: 1, status: '未着手', sortOrder: 1 },
  { id: 2, status: '未着手', sortOrder: 2 },
  { id: 3, status: '未着手', sortOrder: 3 },
  { id: 4, status: '作業中', sortOrder: 1 },
]

const orderOf = (list, status) =>
  list
    .filter((t) => t.status === status)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => t.id)

describe('moveTaskLocally', () => {
  it('moves a task earlier within the same column', () => {
    expect(orderOf(moveTaskLocally(tasks, 3, '未着手', 0), '未着手')).toEqual([3, 1, 2])
  })

  it('moves a task to the end when no position is given', () => {
    expect(orderOf(moveTaskLocally(tasks, 1, '未着手'), '未着手')).toEqual([2, 3, 1])
  })

  it('inserts into another column at the given position', () => {
    const result = moveTaskLocally(tasks, 2, '作業中', 0)
    expect(orderOf(result, '作業中')).toEqual([2, 4])
    expect(result.find((t) => t.id === 2).status).toBe('作業中')
  })

  it('returns null when the arrangement does not change', () => {
    expect(moveTaskLocally(tasks, 2, '未着手', 1)).toBeNull()
    expect(moveTaskLocally(tasks, 3, '未着手')).toBeNull()
  })

  it('keeps other task fields untouched', () => {
    const result = moveTaskLocally([{ id: 1, status: '未着手', sortOrder: 1, title: 'A' }], 1, '完了')
    expect(result[0].title).toBe('A')
  })
})
