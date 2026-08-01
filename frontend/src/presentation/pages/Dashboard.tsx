import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/application/auth/useAuth'
import { useReservations } from '@/application/reservations/useReservations'
import { useReservationFilters } from '@/application/reservations/useReservationFilters'
import { useCalendar } from '@/application/reservations/useCalendar'
import { useCsvExport } from '@/application/reservations/useCsvExport'
import { useGmailSync } from '@/application/sync/useGmailSync'
import { filterByStatus } from '@/domain/services/reservationStats'
import { getMonthRange, parseMonthKey } from '@/domain/services/calendar'
import { getCurrentMonthRange, getNext30DaysRange } from '@/presentation/shared/dateRanges'
import AppShell from '@/presentation/components/layout/AppShell'
import DashboardHeader from '@/presentation/components/layout/DashboardHeader'
import StatsCards from '@/presentation/components/reservations/StatsCards'
import ActiveReservationsPanel from '@/presentation/components/reservations/ActiveReservationsPanel'
import ReservationStatusTabs from '@/presentation/components/reservations/ReservationStatusTabs'
import ReservationsTable from '@/presentation/components/reservations/ReservationsTable'
import Pagination from '@/presentation/components/reservations/Pagination'
import OccupancyCalendar from '@/presentation/components/calendar/OccupancyCalendar'
import CalendarToolbar from '@/presentation/components/calendar/CalendarToolbar'
import ViewToggle from '@/presentation/components/calendar/ViewToggle'
import SyncResultModal from '@/presentation/components/sync/SyncResultModal'

function getActiveQuickRange(dateFrom: string, dateTo: string): 'month' | 'next30' | 'all' | null {
  if (!dateFrom && !dateTo) return 'all'
  const month = getCurrentMonthRange()
  if (dateFrom === month.from && dateTo === month.to) return 'month'
  const next30 = getNext30DaysRange()
  if (dateFrom === next30.from && dateTo === next30.to) return 'next30'
  return null
}

const PAGE_SIZE = 10

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const filters = useReservationFilters()
  const isCalendar = filters.view === 'calendar'

  const monthParts = parseMonthKey(filters.month)
  const activeDateFilters = isCalendar
    ? getMonthRange(monthParts.year, monthParts.month)
    : filters.dateFilters
  const { reservations, active, occupancy, loading, reload } =
    useReservations(activeDateFilters)
  const calendar = useCalendar(filters.month)
  const { exportingCsv, exportCsv } = useCsvExport()
  const sync = useGmailSync({
    user,
    onAfterImport: async () => {
      await reload()
      filters.setPage(1)
    },
  })

  const filtered = filterByStatus(reservations, filters.filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(filters.page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const showingStart = filtered.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filtered.length)

  function buildReservationPath(id: number) {
    const params = new URLSearchParams()
    if (isCalendar) {
      params.set('dashboardView', 'calendar')
      params.set('dashboardMonth', filters.month)
      return `/reservations/${id}?${params.toString()}`
    }
    params.set('dashboardPage', String(currentPage))
    params.set('dashboardFilter', filters.filter)
    if (filters.dateFrom) params.set('dashboardFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dashboardTo', filters.dateTo)
    return `/reservations/${id}?${params.toString()}`
  }

  async function handleExportCsv() {
    sync.setSyncMsg(null)
    try {
      await exportCsv({
        ...filters.dateFilters,
        status: filters.filter === 'all' ? undefined : filters.filter,
      })
    } catch {
      sync.setSyncMsg('Erro ao exportar CSV.')
    }
  }

  return (
    <AppShell onSignOut={() => void signOut()}>
      <DashboardHeader
        activeQuickRange={getActiveQuickRange(filters.dateFrom, filters.dateTo)}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onDateFromChange={filters.changeDateFrom}
        onDateToChange={filters.changeDateTo}
        onApplyDateRange={filters.applyDateRange}
        onClearDates={filters.clearDateRange}
        onExportCsv={handleExportCsv}
        exporting={exportingCsv}
        exportDisabled={loading || exportingCsv || filtered.length === 0}
        canSyncGmail={sync.canSyncGmail}
        syncStatus={sync.syncStatus}
        syncMsg={sync.syncMsg}
        onOpenSyncModal={sync.openSyncModal}
        googleAuthenticated={sync.googleAuthenticated}
        syncing={sync.syncing}
        authenticatingGoogle={sync.authenticatingGoogle}
        onSync={sync.handleSync}
        onGoogleAuth={sync.handleGoogleAuth}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <ActiveReservationsPanel
          reservations={active}
          onSelect={(id) => navigate(buildReservationPath(id))}
        />
        <StatsCards
          reservations={isCalendar ? reservations : filtered}
          occupancy={occupancy}
        />

        <div key={filters.view} className="page-fade-in">
          {isCalendar ? (
          <>
            <CalendarToolbar
              year={calendar.year}
              month={calendar.month}
              view={filters.view}
              onPrevMonth={() => filters.stepMonth(-1)}
              onNextMonth={() => filters.stepMonth(1)}
              onToday={filters.goToCurrentMonth}
              onChangeView={filters.changeView}
            />
            <OccupancyCalendar
              weeks={calendar.weeks}
              loading={calendar.loading}
              onSelectReservation={(id) => navigate(buildReservationPath(id))}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <ReservationStatusTabs
                filter={filters.filter}
                onChange={filters.changeFilter}
              />
              <ViewToggle view={filters.view} onChange={filters.changeView} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24 text-sm text-ink-muted/70 dark:text-ink-muted-dark/70">
                Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-ink-muted/70 dark:text-ink-muted-dark/70">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Nenhuma reserva encontrada</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface transition-colors dark:border-line-dark dark:bg-surface-dark">
                <ReservationsTable
                  reservations={paginated}
                  fadeKey={`${filters.filter}-${currentPage}`}
                  onRowClick={(id) => navigate(buildReservationPath(id))}
                />
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  showingStart={showingStart}
                  showingEnd={showingEnd}
                  total={filtered.length}
                  onPrev={() => filters.setPage((current) => Math.max(1, current - 1))}
                  onNext={() =>
                    filters.setPage((current) => Math.min(totalPages, current + 1))
                  }
                />
              </div>
            )}
          </>
          )}
        </div>
      </main>

      {sync.isSyncModalOpen && sync.syncResult && (
        <SyncResultModal
          result={sync.syncResult}
          isClosing={sync.isSyncModalClosing}
          onClose={sync.closeSyncModal}
        />
      )}
    </AppShell>
  )
}
