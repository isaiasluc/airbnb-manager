import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/application/auth/useAuth'
import { useReservations } from '@/application/reservations/useReservations'
import { useReservationFilters } from '@/application/reservations/useReservationFilters'
import { useCsvExport } from '@/application/reservations/useCsvExport'
import { useGmailSync } from '@/application/sync/useGmailSync'
import { filterByStatus } from '@/domain/services/reservationStats'
import DashboardHeader from '@/presentation/components/layout/DashboardHeader'
import StatsCards from '@/presentation/components/reservations/StatsCards'
import ReservationStatusTabs from '@/presentation/components/reservations/ReservationStatusTabs'
import ReservationsTable from '@/presentation/components/reservations/ReservationsTable'
import Pagination from '@/presentation/components/reservations/Pagination'
import SyncButton from '@/presentation/components/sync/SyncButton'
import SyncResultModal from '@/presentation/components/sync/SyncResultModal'

const PAGE_SIZE = 10

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const filters = useReservationFilters()
  const { reservations, occupancy, loading, setLoading, reload } =
    useReservations(filters.dateFilters)
  const { exportingCsv, exportCsv } = useCsvExport()
  const sync = useGmailSync({
    user,
    onAfterImport: async () => {
      await reload()
      filters.setPage(1)
    },
  })

  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = filterByStatus(reservations, filters.filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(filters.page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const showingStart = filtered.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(pageStart + PAGE_SIZE, filtered.length)
  const activeFiltersCount =
    (filters.filter === 'all' ? 0 : 1) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0)

  function buildReservationPath(id: number) {
    const params = new URLSearchParams({
      dashboardPage: String(currentPage),
      dashboardFilter: filters.filter,
    })
    if (filters.dateFrom) params.set('dashboardFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dashboardTo', filters.dateTo)
    return `/reservations/${id}?${params.toString()}`
  }

  async function handleHomeClick() {
    navigate('/', { replace: true })
    filters.reset()
    sync.setSyncMsg(null)
    setLoading(true)
    try {
      await reload({})
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen bg-stone-50 font-sans transition-colors dark:bg-stone-950">
      <DashboardHeader
        onHomeClick={handleHomeClick}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        activeFiltersCount={activeFiltersCount}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onDateFromChange={filters.changeDateFrom}
        onDateToChange={filters.changeDateTo}
        onApplyDateRange={filters.applyDateRange}
        onClearDates={filters.clearDateRange}
        onExportCsv={handleExportCsv}
        exporting={exportingCsv}
        exportDisabled={loading || exportingCsv || filtered.length === 0}
        onSignOut={() => void signOut()}
        canSyncGmail={sync.canSyncGmail}
        syncStatus={sync.syncStatus}
        syncMsg={sync.syncMsg}
        onOpenSyncModal={sync.openSyncModal}
      />

      {sync.canSyncGmail && (
        <SyncButton
          googleAuthenticated={sync.googleAuthenticated}
          syncing={sync.syncing}
          authenticatingGoogle={sync.authenticatingGoogle}
          onSync={sync.handleSync}
          onGoogleAuth={sync.handleGoogleAuth}
        />
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <StatsCards reservations={filtered} occupancy={occupancy} />
        <ReservationStatusTabs
          filter={filters.filter}
          onChange={filters.changeFilter}
        />

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-stone-300 dark:text-stone-600">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-stone-300 dark:text-stone-600">
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
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors dark:border-stone-800 dark:bg-stone-900">
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
      </main>

      {sync.isSyncModalOpen && sync.syncResult && (
        <SyncResultModal
          result={sync.syncResult}
          isClosing={sync.isSyncModalClosing}
          onClose={sync.closeSyncModal}
        />
      )}
    </div>
  )
}
