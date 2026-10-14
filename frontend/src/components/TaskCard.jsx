import { getDueDateClass } from '../utils/dueDate'
import { PRIORITY_CLASSES } from '../utils/priority'

export const TASK_DRAG_TYPE = 'text/plain'

export function TaskCard({ task, onClick, onDelete }) {
  return (
    // role は onClick の有無で切り替えている(静的解析では条件付き role を判定できない)。
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(TASK_DRAG_TYPE, String(task.id))
        e.dataTransfer.effectAllowed = 'move'
      }}
      role={onClick ? 'button' : 'group'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`group relative bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
    >
      {onDelete && (
        <button
          type="button"
          aria-label={`${task.title}を削除`}
          title="削除"
          draggable={false}
          // 詳細モーダルを開くカード側のクリック・キー操作に伝えない。
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="absolute top-1.5 right-1.5 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      )}
      <p className="font-medium text-gray-900 pr-6">{task.title}</p>
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}
        >
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`text-xs ${getDueDateClass(task.dueDate)}`}>
            期限: {task.dueDate}
          </span>
        )}
      </div>
    </div>
  )
}
