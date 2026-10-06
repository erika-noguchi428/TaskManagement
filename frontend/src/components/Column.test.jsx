import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Column } from './Column'

const tasks = [
  { id: 1, title: 'タスク1', priority: '高', dueDate: null, status: '未着手', sortOrder: 1 },
  { id: 2, title: 'タスク2', priority: '中', dueDate: null, status: '未着手', sortOrder: 2 },
]

describe('Column', () => {
  it('renders an empty state message when there are no tasks', () => {
    render(<Column title="未着手" tasks={[]} />)

    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
  })

  it('renders a card for each task', () => {
    render(<Column title="未着手" tasks={tasks} />)

    expect(screen.getByText('タスク1')).toBeInTheDocument()
    expect(screen.getByText('タスク2')).toBeInTheDocument()
  })

  describe('sort buttons', () => {
    const unsorted = [
      { id: 1, title: 'A', priority: '低', dueDate: '2026-10-01', status: '未着手', sortOrder: 1 },
      { id: 2, title: 'B', priority: '高', dueDate: '2026-12-01', status: '未着手', sortOrder: 2 },
      { id: 3, title: 'C', priority: '中', dueDate: '2026-09-01', status: '未着手', sortOrder: 3 },
    ]
    const titles = () =>
      screen.getAllByText(/^[ABC]$/).map((el) => el.textContent)

    it('sorts only by the clicked key and toggles back to the original order', async () => {
      const user = userEvent.setup()
      render(<Column title="未着手" tasks={unsorted} />)
      expect(titles()).toEqual(['A', 'B', 'C'])

      await user.click(screen.getByRole('button', { name: '重要度順' }))
      expect(titles()).toEqual(['B', 'C', 'A'])
      expect(screen.getByRole('button', { name: '重要度順' })).toHaveAttribute('aria-pressed', 'true')

      await user.click(screen.getByRole('button', { name: '期日順' }))
      expect(titles()).toEqual(['C', 'A', 'B'])

      await user.click(screen.getByRole('button', { name: '期日順' }))
      expect(titles()).toEqual(['A', 'B', 'C'])
    })
  })
})
