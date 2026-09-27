import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaskCard } from './TaskCard'

const baseTask = {
  id: 1,
  title: 'テストタスク',
  description: null,
  priority: '高',
  dueDate: null,
  status: '未着手',
  sortOrder: 1,
}

describe('TaskCard', () => {
  it('renders title and priority', () => {
    render(<TaskCard task={baseTask} />)

    expect(screen.getByText('テストタスク')).toBeInTheDocument()
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('does not render a due date row when dueDate is null', () => {
    render(<TaskCard task={baseTask} />)

    expect(screen.queryByText(/期限:/)).not.toBeInTheDocument()
  })

  it('renders an overdue due date with the overdue style', () => {
    const overdueTask = { ...baseTask, dueDate: '2020-01-01' }
    render(<TaskCard task={overdueTask} />)

    const dueDateEl = screen.getByText(/期限:/)
    expect(dueDateEl).toHaveClass('text-red-700')
  })
})
