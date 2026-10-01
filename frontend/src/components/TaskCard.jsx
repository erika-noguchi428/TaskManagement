import { getDueDateClass } from '../utils/dueDate'
import { PRIORITY_CLASSES } from '../utils/priority'

export function TaskCard({ task }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2">
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
