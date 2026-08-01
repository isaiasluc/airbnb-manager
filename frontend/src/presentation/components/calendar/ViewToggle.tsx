import type { DashboardView } from '@/application/reservations/useReservationFilters'
import SegmentedControl from '@/presentation/shared/SegmentedControl'

export default function ViewToggle({
  view,
  onChange,
}: {
  view: DashboardView
  onChange: (view: DashboardView) => void
}) {
  return (
    <div className="mb-5">
      <SegmentedControl
        options={[
          { value: 'list' as const, label: 'Lista' },
          { value: 'calendar' as const, label: 'Calendário' },
        ]}
        value={view}
        onChange={onChange}
      />
    </div>
  )
}
