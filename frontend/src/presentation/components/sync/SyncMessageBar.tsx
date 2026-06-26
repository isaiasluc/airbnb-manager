export default function SyncMessageBar({
  syncMsg,
  onOpenSyncModal,
}: {
  syncMsg: string
  onOpenSyncModal: () => void
}) {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-3">
      <button
        type="button"
        onClick={onOpenSyncModal}
        className="inline-block rounded-md bg-stone-100 px-3 py-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      >
        {syncMsg}
      </button>
    </div>
  )
}
