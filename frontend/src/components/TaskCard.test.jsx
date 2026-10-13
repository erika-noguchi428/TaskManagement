import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

describe('TaskCard trash button', () => {
  it('is not rendered without onDelete', () => {
    render(<TaskCard task={baseTask} />)

    expect(screen.queryByRole('button', { name: /削除/ })).not.toBeInTheDocument()
  })

  it('calls onDelete without triggering the card click', async () => {
    const onClick = vi.fn()
    const onDelete = vi.fn()
    render(<TaskCard task={baseTask} onClick={onClick} onDelete={onDelete} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'テストタスクを削除' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is revealed on hover and focus via CSS classes', () => {
    render(<TaskCard task={baseTask} onDelete={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'テストタスクを削除' })
    expect(button).toHaveClass('opacity-0', 'group-hover:opacity-100', 'focus:opacity-100')
  })
})
