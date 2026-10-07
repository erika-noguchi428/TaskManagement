import { useEffect, useState } from 'react'
import { createTask, updateTask } from '../api/tasks'
import { STATUSES } from '../utils/groupByStatus'
import { PRIORITY_OPTIONS } from '../utils/priority'

const DEFAULT_PRIORITY = '中'

// taskを渡すと詳細表示で開き、「編集」を押すと編集モードになる。編集中は閉じるときに変更があれば保存する。
export function TaskFormModal({ task, onClose, onCreated, onUpdated }) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState(task?.priority ?? DEFAULT_PRIORITY)
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [status, setStatus] = useState(task?.status ?? '未着手')
  const [editing, setEditing] = useState(!isEdit)
  const [titleError, setTitleError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCloseWithSave() {
    if (submitting) return
    const unchanged =
      title === task.title &&
      description === (task.description ?? '') &&
      priority === task.priority &&
      dueDate === (task.dueDate ?? '') &&
      status === task.status
    if (unchanged) {
      onClose()
      return
    }
    if (!title.trim()) {
      setTitleError('タイトルを入力してください')
      return
    }
    setTitleError(null)
    setSubmitError(null)
    setSubmitting(true)
    try {
      await updateTask(task.id, { title: title.trim(), description, priority, dueDate, status })
      onUpdated()
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? err.message)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isEdit) return undefined
    function handleKeyDown(e) {
      if (e.key === 'Escape') (editing ? handleCloseWithSave : onClose)()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  if (isEdit && !editing) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-form-title"
          className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 space-y-4"
        >
          <h2 id="task-form-title" className="text-lg font-semibold text-gray-900">
            タスクの詳細
          </h2>
          <dl className="space-y-3 text-sm">
            <DetailItem label="タイトル" value={task.title} />
            <DetailItem label="説明文" value={task.description} multiline />
            <DetailItem label="優先度" value={task.priority} />
            <DetailItem label="期限" value={task.dueDate} />
            <DetailItem label="ステータス" value={task.status} />
          </dl>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              閉じる
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              編集
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isEdit) {
      handleCloseWithSave()
      return
    }
    if (!title.trim()) {
      setTitleError('タイトルを入力してください')
      return
    }
    setTitleError(null)
    setSubmitError(null)
    setSubmitting(true)
    try {
      await createTask({ title: title.trim(), description, priority, dueDate })
      onCreated()
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? err.message)
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10"
      onMouseDown={isEdit ? (e) => e.target === e.currentTarget && handleCloseWithSave() : undefined}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 space-y-4"
      >
        <h2 id="task-form-title" className="text-lg font-semibold text-gray-900">
          {isEdit ? 'タスクを編集' : 'タスクを追加'}
        </h2>

        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル <span className="text-red-600">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
          {titleError && <p className="text-sm text-red-600 mt-1">{titleError}</p>}
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
            説明文
          </label>
          <textarea
            id="task-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
              優先度 <span className="text-red-600">*</span>
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
              期限
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        {isEdit && (
          <div>
            <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2 text-sm">
            {isEdit ? '更新' : '登録'}に失敗しました: {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={handleCloseWithSave}
              disabled={submitting}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              閉じる
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                登録
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

function DetailItem({ label, value, multiline = false }) {
  return (
    <div>
      <dt className="font-medium text-gray-700">{label}</dt>
      <dd className={`text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value || '-'}</dd>
    </div>
  )
}
