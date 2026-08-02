import { useEffect, useRef, useState } from 'react'
import { formatDateRangeLabel, formatMonthLabel } from './format'

export interface DateRangePreset {
  key: string
  label: string
  from: string
  to: string
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type GridDay = { date: string; day: number; isCurrentMonth: boolean }

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthOf(dateKey: string): { year: number; month: number } {
  const [year, month] = dateKey.split('-').map(Number)
  return { year, month }
}

function addMonth(month: { year: number; month: number }, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(month.year, month.month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

function buildGridWeeks(year: number, month: number): GridDay[][] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstOfMonth.getUTCDay())

  const weeks: GridDay[][] = []
  const cursor = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const days: GridDay[] = []
    for (let d = 0; d < 7; d++) {
      days.push({
        date: cursor.toISOString().slice(0, 10),
        day: cursor.getUTCDate(),
        isCurrentMonth: cursor.getUTCMonth() === month - 1,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

export default function DateRangePicker({
  dateFrom,
  dateTo,
  presets,
  onApply,
}: {
  dateFrom: string
  dateTo: string
  presets: DateRangePreset[]
  onApply: (range: { from: string; to: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => monthOf(dateFrom || todayKey()))
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSelectionStart(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setSelectionStart(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function toggleOpen() {
    setOpen((current) => {
      const next = !current
      if (next) {
        setVisibleMonth(monthOf(dateFrom || todayKey()))
        setSelectionStart(null)
      }
      return next
    })
  }

  function handleDayClick(date: string) {
    if (!selectionStart) {
      setSelectionStart(date)
      return
    }
    const from = date < selectionStart ? date : selectionStart
    const to = date < selectionStart ? selectionStart : date
    onApply({ from, to })
    setSelectionStart(null)
    setOpen(false)
  }

  function handlePreset(preset: DateRangePreset) {
    onApply({ from: preset.from, to: preset.to })
    setSelectionStart(null)
    setOpen(false)
  }

  const activePreset = presets.find((preset) => preset.from === dateFrom && preset.to === dateTo)
  const label = activePreset ? activePreset.label : formatDateRangeLabel(dateFrom, dateTo)

  const previewStart = selectionStart ?? (dateFrom || null)
  const previewEndRaw = selectionStart ? (hoverDate ?? selectionStart) : dateTo || null
  const rangeStart = previewStart && previewEndRaw ? (previewStart < previewEndRaw ? previewStart : previewEndRaw) : previewStart
  const rangeEnd = previewStart && previewEndRaw ? (previewStart < previewEndRaw ? previewEndRaw : previewStart) : previewEndRaw

  const weeks = buildGridWeeks(visibleMonth.year, visibleMonth.month)
  const today = todayKey()

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:border-accent/40 dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:hover:border-accent-dark/40"
      >
        <svg className="h-4 w-4 shrink-0 text-ink-muted dark:text-ink-muted-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        {label}
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-150 dark:text-ink-muted-dark ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="popover-enter absolute left-0 top-full z-40 mt-2 w-[300px] rounded-xl border border-line bg-surface p-3 shadow-lg dark:border-line-dark dark:bg-surface-dark">
          {presets.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5 border-b border-line pb-3 dark:border-line-dark">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    activePreset?.key === preset.key
                      ? 'bg-accent-soft text-accent dark:bg-accent-soft-dark dark:text-accent-dark'
                      : 'bg-paper text-ink-muted hover:text-ink dark:bg-paper-dark dark:text-ink-muted-dark dark:hover:text-ink-dark'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => addMonth(m, -1))}
              aria-label="Mês anterior"
              className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark"
            >
              ‹
            </button>
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-ink dark:text-ink-dark">
              {formatMonthLabel(visibleMonth.year, visibleMonth.month)}
            </p>
            <button
              type="button"
              onClick={() => setVisibleMonth((m) => addMonth(m, 1))}
              aria-label="Próximo mês"
              className="flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-paper hover:text-ink dark:text-ink-muted-dark dark:hover:bg-paper-dark dark:hover:text-ink-dark"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={index} className="pb-1 text-center text-[10px] font-medium text-ink-muted dark:text-ink-muted-dark">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHoverDate(null)}>
            {weeks.flat().map((day) => {
              const inRange = !!(rangeStart && rangeEnd && day.date >= rangeStart && day.date <= rangeEnd)
              const isEndpoint = day.date === rangeStart || day.date === rangeEnd
              const isToday = day.date === today

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.isCurrentMonth}
                  onClick={() => handleDayClick(day.date)}
                  onMouseEnter={() => selectionStart && setHoverDate(day.date)}
                  className={`relative flex h-8 items-center justify-center text-xs transition-colors ${
                    !day.isCurrentMonth
                      ? 'text-transparent'
                      : isEndpoint
                        ? 'font-semibold text-white'
                        : inRange
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-ink hover:bg-paper dark:text-ink-dark dark:hover:bg-paper-dark'
                  } ${isEndpoint ? 'bg-accent rounded-full dark:bg-accent-dark' : inRange ? 'bg-accent-soft dark:bg-accent-soft-dark' : ''} ${
                    isToday && !isEndpoint ? 'ring-1 ring-inset ring-accent/50 rounded-full dark:ring-accent-dark/50' : ''
                  }`}
                >
                  {day.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
