import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../contexts/useAuth'
import type { Reservation } from '../lib/types'
import { fetchReservation, updateReservation, deleteReservation, sendReservationEmail } from '../lib/api'
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
  const { signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
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

  async function handleSendEmail() {
    if (!reservation) return
    setSendingEmail(true)
    setEmailError(null)
    try {
      await sendReservationEmail(reservation.id)
      const updated = await updateReservation(reservation.id, { email_sent: true })
      setReservation(updated)
    } catch (error) {
      setEmailError((error as Error).message)
    } finally {
      setSendingEmail(false)
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

  async function changeHostServiceStatus(
    host_service_status: Reservation['host_service_status'],
  ) {
    if (!reservation) return
    setSaving(true)
    try {
      const updated = await updateReservation(reservation.id, { host_service_status })
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
      navigate(backToDashboardPath)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-sm text-stone-300 dark:bg-stone-950 dark:text-stone-600">
        Carregando...
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-sm text-stone-400 dark:bg-stone-950 dark:text-stone-500">
        Reserva não encontrada.
      </div>
    )
  }

  const nights = nightsCount(reservation.checkin_at, reservation.checkout_at)
  const dashboardPage = searchParams.get('dashboardPage')
  const dashboardFilter = searchParams.get('dashboardFilter')
  const dashboardFrom = searchParams.get('dashboardFrom')
  const dashboardTo = searchParams.get('dashboardTo')
  const dashboardParams = new URLSearchParams()

  if (dashboardPage) dashboardParams.set('page', dashboardPage)
  if (dashboardFilter) dashboardParams.set('filter', dashboardFilter)
  if (dashboardFrom) dashboardParams.set('from', dashboardFrom)
  if (dashboardTo) dashboardParams.set('to', dashboardTo)

  const backToDashboardPath = dashboardParams.size
    ? `/?${dashboardParams.toString()}`
    : '/'

  return (
    <div className="min-h-screen bg-stone-50 font-sans transition-colors dark:bg-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-950">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(backToDashboardPath)}
            className="text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-stone-900 tracking-tight dark:text-stone-100">
              {guestName(reservation.guest_first_name, reservation.guest_last_name)}
            </h1>
            <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">{reservation.confirmation_code}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
            >
              Sair
            </button>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusColor[reservation.status]}`}>
              {statusLabel[reservation.status]}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        {/* Datas */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
          <div className="grid grid-cols-2 divide-x divide-stone-100 dark:divide-stone-800">
            <div className="px-6 py-5">
              <p className="mb-1.5 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Check-in</p>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">{formatDate(reservation.checkin_at)}</p>
              <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">14:00</p>
            </div>
            <div className="px-6 py-5">
              <p className="mb-1.5 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Check-out</p>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">{formatDate(reservation.checkout_at)}</p>
              <p className="mt-0.5 text-sm text-stone-400 dark:text-stone-500">12:00</p>
            </div>
          </div>
          <div className="flex items-center gap-6 border-t border-stone-100 px-6 py-4 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
            <span><strong className="text-stone-800 dark:text-stone-200">{nights}</strong> noite{nights !== 1 ? 's' : ''}</span>
            <span><strong className="text-stone-800 dark:text-stone-200">{reservation.guests_count}</strong> hóspede{reservation.guests_count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Financeiro */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
          <div className="grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-stone-800">
            <div className="px-6 py-5">
              <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Repasse do host</p>
              <p className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
                {formatCurrency(Number(reservation.host_payout), reservation.currency)}
              </p>
              <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
                {formatCurrency(Number(reservation.host_payout) / nights, reservation.currency)} por noite
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Taxa de serviço</p>
              <p className="text-3xl font-semibold text-stone-900 dark:text-stone-100">
                {formatCurrency(Number(reservation.host_service_fee), reservation.currency)}
              </p>
              <div className="mt-3 flex gap-2">
                {(['pending', 'paid', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => changeHostServiceStatus(status)}
                    disabled={saving || reservation.host_service_status === status}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ring-1 transition-colors disabled:opacity-50 ${
                      reservation.host_service_status === status
                        ? hostServiceStatusColor[status]
                        : 'bg-white text-stone-500 ring-stone-200 hover:bg-stone-50 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800'
                    }`}
                  >
                    {hostServiceStatusLabel[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white px-6 py-5 transition-colors dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Ações</p>

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sendingEmail || saving || reservation.email_sent}
            className="inline-flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
          >
            {sendingEmail ? 'Enviando...' : reservation.email_sent ? 'E-mail enviado' : 'Enviar e-mail'}
          </button>
          {emailError && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {emailError}
            </p>
          )}

          {/* Email enviado */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-200">Email enviado</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">Marque após enviar as informações de check-in</p>
            </div>
            <button
              onClick={toggleEmailSent}
              disabled={saving || sendingEmail}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                reservation.email_sent ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-200 dark:bg-stone-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                reservation.email_sent ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Status */}
          <div>
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-200">Alterar status</p>
            <div className="flex gap-2">
              {(['confirmed', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving || reservation.status === s}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                    reservation.status === s
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-100 bg-white px-6 py-5 transition-colors dark:border-red-950 dark:bg-stone-900">
          <p className="mb-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Zona de perigo</p>
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
                onClick={handleDelete}
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
      </main>
    </div>
  )
}
