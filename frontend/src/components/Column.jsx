import { useState } from 'react'
import { COLUMN_SORTS, sortTasks } from '../utils/sortTasks'
import { TaskCard } from './TaskCard'

export function Column({ title, tasks, onAddClick, onTaskClick }) {
  // 並び替えはこの列だけに適用する。選択中のボタンを再度押すと解除して元の並びに戻る。
  const [columnSort, setColumnSort] = useState(null)
  const displayedTasks = sortTasks(tasks, columnSort)

  return (
    <div className="flex-1 bg-gray-50 rounded-lg p-3 min-w-64">
      <h2 className="font-semibold text-gray-800 mb-2">{title}</h2>
      <div className="flex gap-1 mb-3">
        {COLUMN_SORTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={columnSort === key}
            onClick={() => setColumnSort(columnSort === key ? null : key)}
            className={`px-2 py-0.5 text-xs rounded border ${
              columnSort === key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {displayedTasks.length === 0 ? (
          <p className="text-sm text-gray-400">タスクがありません</p>
        ) : (
          displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick ? () => onTaskClick(task) : undefined}
            />
          ))
        )}
      </div>
      {onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          className="mt-3 w-full text-left text-sm text-gray-600 hover:bg-gray-200 rounded px-2 py-1.5"
        >
          + タスクを追加
        </button>
      )}
    </div>
  )
}
