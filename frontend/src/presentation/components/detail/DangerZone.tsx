import { useState } from 'react'

export default function DangerZone({
  deleting,
  onDelete,
}: {
  deleting: boolean
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="rounded-xl border border-red-100 bg-white px-6 py-5 transition-colors dark:border-red-950 dark:bg-stone-900">
      <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
        Zona de perigo
      </p>
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-sm font-medium text-red-500 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Remover reserva
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-sm text-stone-600 dark:text-stone-300">Tem certeza?</p>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? 'Removendo...' : 'Confirmar'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-stone-400 transition-colors hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
