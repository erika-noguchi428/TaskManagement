import { useState } from 'react'
import { COLUMN_SORTS, sortTasks } from '../utils/sortTasks'
import { TASK_DRAG_TYPE, TaskCard } from './TaskCard'

// カーソル位置から挿入位置(0〜件数。ドラッグ中のカードを含む並びでの隙間の番号)を求める。
// カードの上半分なら手前、下半分なら次の隙間。カード以外(余白など)なら末尾。
function getInsertIndex(e, count) {
  const card = e.target.closest?.('[data-task-index]')
  if (!card) return count
  const index = Number(card.dataset.taskIndex)
  const rect = card.getBoundingClientRect()
  return e.clientY < rect.top + rect.height / 2 ? index : index + 1
}

export function Column({ title, tasks, onAddClick, onTaskClick, onTaskDrop, reorderable = true }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [insertIndex, setInsertIndex] = useState(null)
  // 並び替えはこの列だけに適用する。選択中のボタンを再度押すと解除して元の並びに戻る。
  const [columnSort, setColumnSort] = useState(null)
  const displayedTasks = sortTasks(tasks, columnSort)
  // 一覧の並び替え指定中・列の並び替えボタン選択中は、表示順と保存順が異なるため位置指定をしない。
  const canReorder = reorderable && columnSort === null

  return (
    <div
      onDragOver={
        onTaskDrop
          ? (e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setIsDragOver(true)
              setInsertIndex(canReorder ? getInsertIndex(e, tasks.length) : null)
            }
          : undefined
      }
      onDragLeave={
        onTaskDrop
          ? () => {
              setIsDragOver(false)
              setInsertIndex(null)
            }
          : undefined
      }
      onDrop={
        onTaskDrop
          ? (e) => {
              e.preventDefault()
              setIsDragOver(false)
              setInsertIndex(null)
              const taskId = Number(e.dataTransfer.getData(TASK_DRAG_TYPE))
              if (!taskId) return
              if (!canReorder) {
                // 位置指定できない状態で自分の列に戻した場合は何もしない。
                if (!tasks.some((t) => t.id === taskId)) onTaskDrop(taskId, title)
                return
              }
              // 線の位置(隙間の番号)を、ドラッグ中のカードを除いた並びでの位置に直す。
              const gap = getInsertIndex(e, tasks.length)
              const draggedIndex = tasks.findIndex((t) => t.id === taskId)
              onTaskDrop(taskId, title, draggedIndex !== -1 && draggedIndex < gap ? gap - 1 : gap)
            }
          : undefined
      }
      className={`flex-1 rounded-lg p-3 min-w-64 ${
        isDragOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'
      }`}
    >
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
          displayedTasks.map((task, index) => (
            <div key={task.id} data-task-index={index} className="relative">
              {insertIndex === index && <DropIndicator position="top" />}
              <TaskCard
                task={task}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
              />
              {insertIndex === displayedTasks.length && index === displayedTasks.length - 1 && (
                <DropIndicator position="bottom" />
              )}
            </div>
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

// 挿入位置を示す線。レイアウトがずれてドラッグ判定が揺れないよう、絶対配置で重ねる。
function DropIndicator({ position }) {
  return (
    <div
      data-testid="drop-indicator"
      className={`absolute left-0 right-0 h-0.5 bg-blue-500 rounded pointer-events-none ${
        position === 'top' ? '-top-1.5' : '-bottom-1.5'
      }`}
    />
  )
}
