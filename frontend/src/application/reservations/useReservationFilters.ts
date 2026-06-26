import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  RESERVATION_FILTERS,
  type ReservationFilter,
} from '@/domain/services/reservationStats'
import type { ReservationDateFilters } from '@/infrastructure/reservations/reservationApi'

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function getInitialPage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function getInitialFilter(value: string | null): ReservationFilter {
  return RESERVATION_FILTERS.includes(value as ReservationFilter)
    ? (value as ReservationFilter)
    : 'all'
}

function getInitialDate(value: string | null) {
  return value && DATE_PARAM_PATTERN.test(value) ? value : ''
}

export function useReservationFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilterState] = useState<ReservationFilter>(() =>
    getInitialFilter(searchParams.get('filter')),
  )
  const [page, setPage] = useState(() =>
    getInitialPage(searchParams.get('page')),
  )
  const [dateFrom, setDateFrom] = useState(() =>
    getInitialDate(searchParams.get('from')),
  )
  const [dateTo, setDateTo] = useState(() =>
    getInitialDate(searchParams.get('to')),
  )

  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', String(page))
    if (filter !== 'all') params.set('filter', filter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    setSearchParams(params, { replace: true })
  }, [dateFrom, dateTo, filter, page, setSearchParams])

  const dateFilters: ReservationDateFilters = {
    from: dateFrom || undefined,
    to: dateTo || undefined,
  }

  function changeFilter(next: ReservationFilter) {
    setFilterState(next)
    setPage(1)
  }

  function changeDateFrom(value: string) {
    setDateFrom(value)
    setPage(1)
  }

  function changeDateTo(value: string) {
    setDateTo(value)
    setPage(1)
  }

  function applyDateRange(range: { from: string; to: string }) {
    setDateFrom(range.from)
    setDateTo(range.to)
    setPage(1)
  }

  function clearDateRange() {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  function reset() {
    setFilterState('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return {
    filter,
    page,
    dateFrom,
    dateTo,
    dateFilters,
    setPage,
    changeFilter,
    changeDateFrom,
    changeDateTo,
    applyDateRange,
    clearDateRange,
    reset,
  }
}
