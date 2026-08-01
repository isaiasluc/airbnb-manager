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
        className="inline-block rounded-md bg-accent-soft px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent-soft/70 dark:bg-accent-soft-dark dark:text-accent-dark dark:hover:bg-accent-soft-dark/70"
      >
        {syncMsg}
      </button>
    </div>
  )
}
