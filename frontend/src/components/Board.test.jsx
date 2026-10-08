import { createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTask, fetchTasks, moveTask } from '../api/tasks'
import { Board } from './Board'

vi.mock('../api/tasks', () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  moveTask: vi.fn(),
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
    // dropOn: { title, half } でカードの上半分('top')・下半分('bottom')を指定する。
    const makeDataTransfer = () => {
      const data = {}
      return {
        setData: (type, value) => (data[type] = value),
        getData: (type) => data[type],
      }
    }

    const pointAt = ({ title, half }) => {
      const card = screen.getByText(title).closest('[data-task-index]')
      card.getBoundingClientRect = () => ({ top: 0, height: 100 })
      return { target: card, clientY: half === 'top' ? 25 : 75 }
    }

    // jsdomのDragEventはclientYを受け取らないため、イベントに直接設定する。
    const fireDrag = (type, target, dataTransfer, clientY = 0) => {
      const event = createEvent[type](target, { dataTransfer })
      Object.defineProperty(event, 'clientY', { value: clientY })
      fireEvent(target, event)
    }

    const dragTo = (cardTitle, columnTitle, dropOn) => {
      const dataTransfer = makeDataTransfer()
      const { target, clientY } = dropOn
        ? pointAt(dropOn)
        : { target: screen.getByRole('heading', { name: columnTitle }).parentElement, clientY: 0 }
      fireEvent.dragStart(screen.getByText(cardTitle), { dataTransfer })
      fireDrag('dragOver', target, dataTransfer, clientY)
      fireDrag('drop', target, dataTransfer, clientY)
    }

    beforeEach(() => { moveTask.mockReset() })

    it('updates the status when a card is dropped on another column', async () => {
      moveTask.mockResolvedValue({})
      render(<Board />)
      await screen.findByText('未着手タスク')

      dragTo('未着手タスク', '作業中')

      expect(moveTask).toHaveBeenCalledWith(1, { status: '作業中', position: 1 })
      const column = screen.getByRole('heading', { name: '作業中' }).parentElement
      expect(column).toHaveTextContent('未着手タスク')
    })

    it('does nothing when dropped on the same column', async () => {
      render(<Board />)
      await screen.findByText('未着手タスク')

      dragTo('未着手タスク', '未着手')

      expect(moveTask).not.toHaveBeenCalled()
    })

    it('shows an error and refetches when the update fails', async () => {
      moveTask.mockRejectedValue({ response: { data: { message: 'boom' } } })
      render(<Board />)
      await screen.findByText('未着手タスク')
      fetchTasks.mockClear()

      dragTo('未着手タスク', '完了')

      await waitFor(() => expect(fetchTasks).toHaveBeenCalled())
      expect(await screen.findByText(/boom/)).toBeInTheDocument()
    })

    describe('reordering within a column', () => {
      const threeInOne = [
        { id: 1, title: 'A', priority: '高', dueDate: null, status: '未着手', sortOrder: 1 },
        { id: 2, title: 'B', priority: '高', dueDate: null, status: '未着手', sortOrder: 2 },
        { id: 3, title: 'C', priority: '高', dueDate: null, status: '未着手', sortOrder: 3 },
      ]

      const titlesInColumn = (columnTitle) =>
        within(screen.getByRole('heading', { name: columnTitle }).parentElement)
          .getAllByText(/^[ABC]$/)
          .map((el) => el.textContent)

      it('inserts the dragged card before the card it is dropped on', async () => {
        fetchTasks.mockResolvedValue(threeInOne)
        moveTask.mockResolvedValue({})
        render(<Board />)
        await screen.findByText('A')

        dragTo('C', '未着手', { title: 'A', half: 'top' })

        expect(moveTask).toHaveBeenCalledWith(3, { status: '未着手', position: 0 })
        expect(titlesInColumn('未着手')).toEqual(['C', 'A', 'B'])
      })

      it('inserts after the card when dropped on its lower half', async () => {
        fetchTasks.mockResolvedValue(threeInOne)
        moveTask.mockResolvedValue({})
        render(<Board />)
        await screen.findByText('A')

        dragTo('C', '未着手', { title: 'A', half: 'bottom' })

        expect(moveTask).toHaveBeenCalledWith(3, { status: '未着手', position: 1 })
        expect(titlesInColumn('未着手')).toEqual(['A', 'C', 'B'])
      })

      it('shows a line at the insert position while dragging and hides it on leave', async () => {
        fetchTasks.mockResolvedValue(threeInOne)
        render(<Board />)
        await screen.findByText('A')
        const dataTransfer = makeDataTransfer()
        fireEvent.dragStart(screen.getByText('C'), { dataTransfer })

        const top = pointAt({ title: 'B', half: 'top' })
        fireDrag('dragOver', top.target, dataTransfer, top.clientY)
        const line = screen.getByTestId('drop-indicator')
        expect(line.parentElement).toHaveTextContent('B')
        expect(line.className).toContain('-top-1.5')

        const last = pointAt({ title: 'C', half: 'bottom' })
        fireDrag('dragOver', last.target, dataTransfer, last.clientY)
        expect(screen.getAllByTestId('drop-indicator')).toHaveLength(1)
        expect(screen.getByTestId('drop-indicator').className).toContain('-bottom-1.5')

        fireEvent.dragLeave(last.target, { dataTransfer })
        expect(screen.queryByTestId('drop-indicator')).not.toBeInTheDocument()
      })

      it('moves the card to the end when dropped on the column background', async () => {
        fetchTasks.mockResolvedValue(threeInOne)
        moveTask.mockResolvedValue({})
        render(<Board />)
        await screen.findByText('A')

        dragTo('A', '未着手')

        expect(moveTask).toHaveBeenCalledWith(1, { status: '未着手', position: 2 })
        expect(titlesInColumn('未着手')).toEqual(['B', 'C', 'A'])
      })

      it('inserts at the dropped position when moving to another column', async () => {
        fetchTasks.mockResolvedValue([
          ...threeInOne,
          { id: 4, title: 'X', priority: '高', dueDate: null, status: '作業中', sortOrder: 1 },
        ])
        moveTask.mockResolvedValue({})
        render(<Board />)
        await screen.findByText('A')

        dragTo('A', '作業中', { title: 'X', half: 'top' })

        expect(moveTask).toHaveBeenCalledWith(1, { status: '作業中', position: 0 })
      })
    })
  })
})
