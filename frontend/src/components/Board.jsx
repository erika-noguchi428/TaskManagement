import { useEffect, useState } from 'react'
import { fetchTasks } from '../api/tasks'
import { groupByStatus, orderForColumn, STATUSES } from '../utils/groupByStatus'
import { Column } from './Column'
import { TaskFormModal } from './TaskFormModal'
import { FilterBar } from './FilterBar'

const KEYWORD_DEBOUNCE_MS = 300

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function Board() {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [sort, setSort] = useState('')

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const debouncedKeyword = useDebouncedValue(keyword, KEYWORD_DEBOUNCE_MS)

  useEffect(() => {
    let isCurrent = true

    setLoading(true)
    fetchTasks({ keyword: debouncedKeyword, status, priority, sort })
      .then((data) => {
        if (!isCurrent) return
        setTasks(data)
        setError(null)
      })
      .catch((err) => {
        if (!isCurrent) return
        setError(err.response?.data?.message ?? err.message)
      })
      .finally(() => {
        if (!isCurrent) return
        setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [debouncedKeyword, status, priority, sort, reloadKey])

  const grouped = groupByStatus(tasks)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">タスク管理ボード</h1>

      <FilterBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        sort={sort}
        onSortChange={setSort}
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4">
          エラーが発生しました: {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : (
        <div className="flex gap-4">
          {STATUSES.map((statusLabel) => (
            <Column
              key={statusLabel}
              title={statusLabel}
              tasks={orderForColumn(grouped[statusLabel], sort)}
              onAddClick={statusLabel === '未着手' ? () => setShowForm(true) : undefined}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            setReloadKey((key) => key + 1)
          }}
        />
      )}
    </div>
  )
}
