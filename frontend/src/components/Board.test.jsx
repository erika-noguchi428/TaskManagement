import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask, fetchTasks, updateTask } from '../api/tasks'
import { Board } from './Board'

vi.mock('../api/tasks', () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
}))

const tasks = [
  { id: 1, title: '未着手タスク', priority: '高', dueDate: null, status: '未着手', sortOrder: 1 },
  { id: 2, title: '作業中タスク', priority: '中', dueDate: null, status: '作業中', sortOrder: 1 },
  { id: 3, title: '完了タスク', priority: '低', dueDate: null, status: '完了', sortOrder: 1 },
]

describe('Board', () => {
  beforeEach(() => {
    fetchTasks.mockReset()
    fetchTasks.mockResolvedValue(tasks)
  })

  it('renders all three columns with tasks grouped by status', async () => {
    render(<Board />)

    expect(await screen.findByText('未着手タスク')).toBeInTheDocument()
    expect(screen.getByText('作業中タスク')).toBeInTheDocument()
    expect(screen.getByText('完了タスク')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '未着手' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '作業中' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '完了' })).toBeInTheDocument()
  })

  it('refetches with the new status filter when the status select changes', async () => {
    const user = userEvent.setup()
    render(<Board />)

    await screen.findByText('未着手タスク')
    fetchTasks.mockClear()

    await user.selectOptions(screen.getByDisplayValue('すべての状態'), '作業中')

    await waitFor(() =>
      expect(fetchTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: '作業中' }),
      ),
    )
  })

  it('opens the add modal from the not-started column, then refetches after saving', async () => {
    createTask.mockResolvedValue({ id: 4 })
    const user = userEvent.setup()
    render(<Board />)

    await screen.findByText('未着手タスク')
    expect(screen.getAllByRole('button', { name: '+ タスクを追加' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '+ タスクを追加' }))
    fetchTasks.mockClear()
    await user.type(screen.getByLabelText(/タイトル/), '追加するタスク')
    await user.click(screen.getByRole('button', { name: '登録' }))

    await waitFor(() => expect(fetchTasks).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('drag and drop', () => {
    const dragTo = (cardTitle, columnTitle) => {
      const data = {}
      const dataTransfer = {
        setData: (type, value) => (data[type] = value),
        getData: (type) => data[type],
      }
      const column = screen.getByRole('heading', { name: columnTitle }).parentElement
      fireEvent.dragStart(screen.getByText(cardTitle), { dataTransfer })
      fireEvent.dragOver(column, { dataTransfer })
      fireEvent.drop(column, { dataTransfer })
    }

    beforeEach(() => { updateTask.mockReset() })

    it('updates the status when a card is dropped on another column', async () => {
      updateTask.mockResolvedValue({})
      render(<Board />)
      await screen.findByText('未着手タスク')

      dragTo('未着手タスク', '作業中')

      expect(updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ status: '作業中' }))
      const column = screen.getByRole('heading', { name: '作業中' }).parentElement
      expect(column).toHaveTextContent('未着手タスク')
    })

    it('does nothing when dropped on the same column', async () => {
      render(<Board />)
      await screen.findByText('未着手タスク')

      dragTo('未着手タスク', '未着手')

      expect(updateTask).not.toHaveBeenCalled()
    })

    it('shows an error and refetches when the update fails', async () => {
      updateTask.mockRejectedValue({ response: { data: { message: 'boom' } } })
      render(<Board />)
      await screen.findByText('未着手タスク')
      fetchTasks.mockClear()

      dragTo('未着手タスク', '完了')

      await waitFor(() => expect(fetchTasks).toHaveBeenCalled())
      expect(await screen.findByText(/boom/)).toBeInTheDocument()
    })
  })
})
