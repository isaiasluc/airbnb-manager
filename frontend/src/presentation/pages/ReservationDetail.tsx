import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/application/auth/useAuth'
import { useReservationDetail } from '@/application/reservations/useReservationDetail'
import { nightsCount } from '@/domain/services/reservationStats'
import DetailHeader from '@/presentation/components/detail/DetailHeader'
import ReservationDates from '@/presentation/components/detail/ReservationDates'
import ReservationFinancials from '@/presentation/components/detail/ReservationFinancials'
import ReservationActions from '@/presentation/components/detail/ReservationActions'
import DangerZone from '@/presentation/components/detail/DangerZone'

function buildBackToDashboardPath(searchParams: URLSearchParams) {
  const dashboardParams = new URLSearchParams()
  const view = searchParams.get('dashboardView')
  const month = searchParams.get('dashboardMonth')

  if (view === 'calendar' && month) {
    dashboardParams.set('view', 'calendar')
    dashboardParams.set('month', month)
    return `/?${dashboardParams.toString()}`
  }

  const page = searchParams.get('dashboardPage')
  const filter = searchParams.get('dashboardFilter')
  const from = searchParams.get('dashboardFrom')
  const to = searchParams.get('dashboardTo')

  if (page) dashboardParams.set('page', page)
  if (filter) dashboardParams.set('filter', filter)
  if (from) dashboardParams.set('from', from)
  if (to) dashboardParams.set('to', to)

  return dashboardParams.size ? `/?${dashboardParams.toString()}` : '/'
}

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const {
    reservation,
    loading,
    saving,
    sendingEmail,
    emailError,
    deleting,
    toggleEmailSent,
    handleSendEmail,
    changeStatus,
    changeHostServiceStatus,
    remove,
  } = useReservationDetail(id)

  const backToDashboardPath = buildBackToDashboardPath(searchParams)

  async function handleDelete() {
    await remove()
    navigate(backToDashboardPath)
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

  return (
    <div className="min-h-screen bg-stone-50 font-sans transition-colors dark:bg-stone-950">
      <DetailHeader
        reservation={reservation}
        onBack={() => navigate(backToDashboardPath)}
        onSignOut={() => void signOut()}
      />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <ReservationDates reservation={reservation} nights={nights} />
        <ReservationFinancials
          reservation={reservation}
          nights={nights}
          saving={saving}
          onChangeHostServiceStatus={changeHostServiceStatus}
        />
        <ReservationActions
          reservation={reservation}
          saving={saving}
          sendingEmail={sendingEmail}
          emailError={emailError}
          onSendEmail={handleSendEmail}
          onToggleEmailSent={toggleEmailSent}
          onChangeStatus={changeStatus}
        />
        <DangerZone deleting={deleting} onDelete={handleDelete} />
      </main>
    </div>
  )
}
