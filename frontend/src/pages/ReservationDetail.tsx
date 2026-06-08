import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Reservation } from '../lib/types'
import { fetchReservation, updateReservation, deleteReservation } from '../lib/api'
import {
  formatDate,
  formatCurrency,
  guestName,
  nightsCount,
  statusLabel,
  statusColor,
  hostServiceStatusLabel,
  hostServiceStatusColor,
} from '../lib/utils'

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetchReservation(Number(id))
      .then(setReservation)
      .finally(() => setLoading(false))
  }, [id])

  async function toggleEmailSent() {
    if (!reservation) return
    setSaving(true)
    try {
      const updated = await updateReservation(reservation.id, { email_sent: !reservation.email_sent })
      setReservation(updated)
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(status: Reservation['status']) {
    if (!reservation) return
    setSaving(true)
    try {
      const updated = await updateReservation(reservation.id, { status })
      setReservation(updated)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!reservation) return
    setDeleting(true)
    try {
      await deleteReservation(reservation.id)
      navigate('/')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-300 text-sm">
        Carregando...
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
        Reserva não encontrada.
      </div>
    )
  }

  const nights = nightsCount(reservation.checkin_at, reservation.checkout_at)

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
              {guestName(reservation.guest_first_name, reservation.guest_last_name)}
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">{reservation.confirmation_code}</p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusColor[reservation.status]}`}>
              {statusLabel[reservation.status]}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Datas */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-stone-100">
            <div className="px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1.5">Check-in</p>
              <p className="text-xl font-semibold text-stone-900">{formatDate(reservation.checkin_at)}</p>
              <p className="text-sm text-stone-400 mt-0.5">14:00</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1.5">Check-out</p>
              <p className="text-xl font-semibold text-stone-900">{formatDate(reservation.checkout_at)}</p>
              <p className="text-sm text-stone-400 mt-0.5">12:00</p>
            </div>
          </div>
          <div className="border-t border-stone-100 px-6 py-4 flex items-center gap-6 text-sm text-stone-500">
            <span><strong className="text-stone-800">{nights}</strong> noite{nights !== 1 ? 's' : ''}</span>
            <span><strong className="text-stone-800">{reservation.guests_count}</strong> hóspede{reservation.guests_count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Repasse do host</p>
              <p className="text-3xl font-semibold text-stone-900">
                {formatCurrency(Number(reservation.host_payout), reservation.currency)}
              </p>
              <p className="text-sm text-stone-400 mt-1">
                {formatCurrency(Number(reservation.host_payout) / nights, reservation.currency)} por noite
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Taxa de serviço</p>
              <p className="text-3xl font-semibold text-stone-900">
                {formatCurrency(Number(reservation.host_service_fee), reservation.currency)}
              </p>
              <span className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${hostServiceStatusColor[reservation.host_service_status]}`}>
                {hostServiceStatusLabel[reservation.host_service_status]}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white rounded-xl border border-stone-200 px-6 py-5 space-y-4">
          <p className="text-xs text-stone-400 uppercase tracking-widest">Ações</p>

          {/* Email enviado */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">Email enviado</p>
              <p className="text-xs text-stone-400">Marque após enviar as informações de check-in</p>
            </div>
            <button
              onClick={toggleEmailSent}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                reservation.email_sent ? 'bg-stone-900' : 'bg-stone-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                reservation.email_sent ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2">Alterar status</p>
            <div className="flex gap-2">
              {(['confirmed', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving || reservation.status === s}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                    reservation.status === s
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl border border-red-100 px-6 py-5">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Zona de perigo</p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remover reserva
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-stone-600">Tem certeza?</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Removendo...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
