const SORT_OPTIONS = [
  { value: '', label: 'デフォルト' },
  { value: 'priority,asc', label: '優先度(高→低)' },
  { value: 'priority,desc', label: '優先度(低→高)' },
  { value: 'dueDate,asc', label: '期限(近い順)' },
  { value: 'dueDate,desc', label: '期限(遠い順)' },
]

export function FilterBar({
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="キーワード検索"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-48"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
      >
        <option value="">すべての状態</option>
        <option value="未着手">未着手</option>
        <option value="作業中">作業中</option>
        <option value="完了">完了</option>
      </select>
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
      >
        <option value="">すべての優先度</option>
        <option value="高">高</option>
        <option value="中">中</option>
        <option value="低">低</option>
      </select>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
