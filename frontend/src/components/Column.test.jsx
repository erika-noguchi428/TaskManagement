import { render, screen } from '@testing-library/react'
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
})
