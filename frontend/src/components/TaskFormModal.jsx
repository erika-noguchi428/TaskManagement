import { useState } from 'react'
import { createTask } from '../api/tasks'
import { PRIORITY_OPTIONS } from '../utils/priority'

const DEFAULT_PRIORITY = '中'

export function TaskFormModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(DEFAULT_PRIORITY)
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-10">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 space-y-4"
      >
        <h2 id="task-form-title" className="text-lg font-semibold text-gray-900">
          タスクを追加
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

        {submitError && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2 text-sm">
            登録に失敗しました: {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2">
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
        </div>
      </form>
    </div>
  )
}
