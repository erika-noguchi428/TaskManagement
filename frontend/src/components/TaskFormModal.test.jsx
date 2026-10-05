import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '../api/tasks'
import { TaskFormModal } from './TaskFormModal'

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
}))

describe('TaskFormModal', () => {
  beforeEach(() => {
    createTask.mockReset()
  })

  it('shows an error and does not call the API when the title is empty', async () => {
    const user = userEvent.setup()
    render(<TaskFormModal onClose={vi.fn()} onCreated={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(screen.getByText('タイトルを入力してください')).toBeInTheDocument()
    expect(createTask).not.toHaveBeenCalled()
  })

  it('submits the entered values and notifies the parent', async () => {
    createTask.mockResolvedValue({ id: 1 })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal onClose={vi.fn()} onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/タイトル/), '  新しいタスク ')
    await user.type(screen.getByLabelText('説明文'), 'メモ')
    await user.selectOptions(screen.getByLabelText(/優先度/), '高')
    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(createTask).toHaveBeenCalledWith({
      title: '新しいタスク',
      description: 'メモ',
      priority: '高',
      dueDate: '',
    })
    expect(onCreated).toHaveBeenCalled()
  })

  it('shows the API error message and stays open when saving fails', async () => {
    createTask.mockRejectedValue({ response: { data: { message: 'title is required' } } })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal onClose={vi.fn()} onCreated={onCreated} />)

    await user.type(screen.getByLabelText(/タイトル/), 'x')
    await user.click(screen.getByRole('button', { name: '登録' }))

    expect(await screen.findByText(/title is required/)).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('calls onClose when cancel is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal onClose={onClose} onCreated={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })
})
