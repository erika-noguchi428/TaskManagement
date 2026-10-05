import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateTask } from '../api/tasks'
import { TaskFormModal } from './TaskFormModal'

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
}))

const task = {
  id: 5,
  title: '既存タスク',
  description: '既存の説明',
  priority: '低',
  dueDate: '2026-10-20',
  status: '作業中',
}

describe('TaskFormModal (edit mode)', () => {
  beforeEach(() => {
    updateTask.mockReset()
  })

  it('shows the current values of the task', () => {
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={vi.fn()} />)

    expect(screen.getByLabelText(/タイトル/)).toHaveValue('既存タスク')
    expect(screen.getByLabelText('説明文')).toHaveValue('既存の説明')
    expect(screen.getByLabelText(/優先度/)).toHaveValue('低')
    expect(screen.getByLabelText('期限')).toHaveValue('2026-10-20')
    expect(screen.getByLabelText('ステータス')).toHaveValue('作業中')
  })

  it('closes without calling the API when nothing changed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal task={task} onClose={onClose} onUpdated={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(updateTask).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('saves the changed values when closed', async () => {
    updateTask.mockResolvedValue({ id: 5 })
    const onUpdated = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={onUpdated} />)

    await user.clear(screen.getByLabelText(/タイトル/))
    await user.type(screen.getByLabelText(/タイトル/), '変更後')
    await user.selectOptions(screen.getByLabelText('ステータス'), '完了')
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(updateTask).toHaveBeenCalledWith(5, {
      title: '変更後',
      description: '既存の説明',
      priority: '低',
      dueDate: '2026-10-20',
      status: '完了',
    })
    expect(onUpdated).toHaveBeenCalled()
  })

  it('stays open with an error when the title is cleared', async () => {
    const onUpdated = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={onUpdated} />)

    await user.clear(screen.getByLabelText(/タイトル/))
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(screen.getByText('タイトルを入力してください')).toBeInTheDocument()
    expect(updateTask).not.toHaveBeenCalled()
    expect(onUpdated).not.toHaveBeenCalled()
  })

  it('stays open and shows the error when saving fails', async () => {
    updateTask.mockRejectedValue({ response: { data: { message: 'boom' } } })
    const onUpdated = vi.fn()
    const user = userEvent.setup()
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={onUpdated} />)

    await user.type(screen.getByLabelText('説明文'), '追記')
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(await screen.findByText(/更新に失敗しました: boom/)).toBeInTheDocument()
    expect(onUpdated).not.toHaveBeenCalled()
  })
})
