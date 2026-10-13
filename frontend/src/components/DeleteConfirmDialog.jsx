import { useEffect } from 'react'

// タスク削除の再確認ダイアログ。OKで削除を実行し、キャンセル・Escでは何もせずに閉じる。
export function DeleteConfirmDialog({ busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-message"
        className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5 space-y-4"
      >
        <p id="delete-confirm-message" className="text-sm text-gray-900">
          本当に削除してよろしいですか（この操作はもとに戻せません。）。
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
