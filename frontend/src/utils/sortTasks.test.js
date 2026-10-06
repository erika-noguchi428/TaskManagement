import { describe, expect, it } from 'vitest'
import { sortTasks } from './sortTasks'

const tasks = [
  { id: 1, priority: '低', dueDate: '2026-10-01' },
  { id: 2, priority: '高', dueDate: null },
  { id: 3, priority: '中', dueDate: '2026-09-15' },
  { id: 4, priority: '高', dueDate: '2026-11-01' },
]

const ids = (list) => list.map((t) => t.id)

describe('sortTasks', () => {
  it('sorts by priority high to low, breaking ties by due date', () => {
    expect(ids(sortTasks(tasks, 'priority'))).toEqual([4, 2, 3, 1])
  })

  it('sorts by due date ascending with undated tasks last, breaking ties by priority', () => {
    expect(ids(sortTasks(tasks, 'dueDate'))).toEqual([3, 1, 4, 2])
  })

  it('returns the original order when no sort is selected and does not mutate input', () => {
    expect(sortTasks(tasks, null)).toBe(tasks)
    sortTasks(tasks, 'priority')
    expect(ids(tasks)).toEqual([1, 2, 3, 4])
  })
})
