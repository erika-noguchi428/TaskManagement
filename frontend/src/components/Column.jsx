import { TaskCard } from './TaskCard'

export function Column({ title, tasks }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg p-3 min-w-64">
      <h2 className="font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400">タスクがありません</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}
