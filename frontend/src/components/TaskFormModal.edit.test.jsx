import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTask, updateTask } from '../api/tasks'
import { TaskFormModal } from './TaskFormModal'

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

const task = {
  id: 5,
  title: '既存タスク',
  description: '既存の説明',
  priority: '低',
  dueDate: '2026-10-20',
  status: '作業中',
}

async function renderEditing(props) {
  const user = userEvent.setup()
  render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={vi.fn()} {...props} />)
  await user.click(screen.getByRole('button', { name: '編集' }))
  return user
}

describe('TaskFormModal (detail view)', () => {
  it('shows the task as read-only text with no inputs', () => {
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={vi.fn()} />)

    expect(screen.getByText('既存タスク')).toBeInTheDocument()
    expect(screen.getByText('既存の説明')).toBeInTheDocument()
    expect(screen.getByText('2026-10-20')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('closes without calling the API', async () => {
    const onClose = vi.fn()
    const user = await renderEditing({ onClose: onClose, onUpdated: vi.fn() })

    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(updateTask).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('switches to the edit form when 編集 is clicked', async () => {
    await renderEditing()

    expect(screen.getByLabelText(/タイトル/)).toHaveValue('既存タスク')
  })
})

describe('TaskFormModal (edit mode)', () => {
  beforeEach(() => {
    updateTask.mockReset()
  })

  it('shows the current values of the task', async () => {
    await renderEditing()

    expect(screen.getByLabelText(/タイトル/)).toHaveValue('既存タスク')
    expect(screen.getByLabelText('説明文')).toHaveValue('既存の説明')
    expect(screen.getByLabelText(/優先度/)).toHaveValue('低')
    expect(screen.getByLabelText('期限')).toHaveValue('2026-10-20')
    expect(screen.getByLabelText('ステータス')).toHaveValue('作業中')
  })

  it('closes without calling the API when nothing changed', async () => {
    const onClose = vi.fn()
    const user = await renderEditing({ onClose: onClose, onUpdated: vi.fn() })

    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(updateTask).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('saves the changed values when closed', async () => {
    updateTask.mockResolvedValue({ id: 5 })
    const onUpdated = vi.fn()
    const user = await renderEditing({ onClose: vi.fn(), onUpdated: onUpdated })

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
    const user = await renderEditing({ onClose: vi.fn(), onUpdated: onUpdated })

    await user.clear(screen.getByLabelText(/タイトル/))
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(screen.getByText('タイトルを入力してください')).toBeInTheDocument()
    expect(updateTask).not.toHaveBeenCalled()
    expect(onUpdated).not.toHaveBeenCalled()
  })

  it('stays open and shows the error when saving fails', async () => {
    updateTask.mockRejectedValue({ response: { data: { message: 'boom' } } })
    const onUpdated = vi.fn()
    const user = await renderEditing({ onClose: vi.fn(), onUpdated: onUpdated })

    await user.type(screen.getByLabelText('説明文'), '追記')
    await user.click(screen.getByRole('button', { name: '閉じる' }))

    expect(await screen.findByText(/更新に失敗しました: boom/)).toBeInTheDocument()
    expect(onUpdated).not.toHaveBeenCalled()
  })
})

describe('TaskFormModal (delete)', () => {
  beforeEach(() => {
    updateTask.mockReset()
    deleteTask.mockReset()
  })

  it('shows 削除 only after entering edit mode', async () => {
    render(<TaskFormModal task={task} onClose={vi.fn()} onUpdated={vi.fn()} onDeleted={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: '編集' }))

    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('asks for confirmation before deleting', async () => {
    const user = await renderEditing({ onDeleted: vi.fn() })

    await user.click(screen.getByRole('button', { name: '削除' }))

    expect(
      screen.getByText('本当に削除してよろしいですか（この操作はもとに戻せません。）。'),
    ).toBeInTheDocument()
    expect(deleteTask).not.toHaveBeenCalled()
  })

  it('deletes the task when はい is clicked', async () => {
    deleteTask.mockResolvedValue()
    const onDeleted = vi.fn()
    const user = await renderEditing({ onDeleted })

    await user.click(screen.getByRole('button', { name: '削除' }))
    await user.click(screen.getByRole('button', { name: 'はい' }))

    expect(deleteTask).toHaveBeenCalledWith(5)
    expect(onDeleted).toHaveBeenCalled()
  })

  it('returns to the edit form without deleting when いいえ is clicked', async () => {
    const onDeleted = vi.fn()
    const user = await renderEditing({ onDeleted })

    await user.click(screen.getByRole('button', { name: '削除' }))
    await user.click(screen.getByRole('button', { name: 'いいえ' }))

    expect(deleteTask).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/タイトル/)).toHaveValue('既存タスク')
  })

  it('cancels the confirmation on Escape without saving or closing', async () => {
    const onClose = vi.fn()
    const user = await renderEditing({ onClose, onDeleted: vi.fn() })

    await user.click(screen.getByRole('button', { name: '削除' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(deleteTask).not.toHaveBeenCalled()
  })

  it('shows an error and keeps the modal open when deleting fails', async () => {
    deleteTask.mockRejectedValue({ response: { data: { message: 'boom' } } })
    const onDeleted = vi.fn()
    const user = await renderEditing({ onDeleted })

    await user.click(screen.getByRole('button', { name: '削除' }))
    await user.click(screen.getByRole('button', { name: 'はい' }))

    expect(await screen.findByText(/削除に失敗しました: boom/)).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
