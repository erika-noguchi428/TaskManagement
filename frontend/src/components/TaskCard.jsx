import { getDueDateClass } from '../utils/dueDate'
import { PRIORITY_CLASSES } from '../utils/priority'

export const TASK_DRAG_TYPE = 'text/plain'

export function TaskCard({ task, onClick }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(TASK_DRAG_TYPE, String(task.id))
        e.dataTransfer.effectAllowed = 'move'
      }}
      role={onClick ? 'button' : undefined}
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
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
    >
      <p className="font-medium text-gray-900">{task.title}</p>
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
