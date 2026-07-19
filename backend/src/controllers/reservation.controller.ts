import type { Request, Response } from 'express'
import * as ReservationService from '../services/reservation.service'
import type { Reservation, ReservationListFilters } from '../types'

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const RESERVATION_STATUSES: Reservation['status'][] = ['confirmed', 'in_progress', 'cancelled', 'completed']

function getDateParam(value: unknown): string | undefined {
  return typeof value === 'string' && DATE_PARAM_PATTERN.test(value)
    ? value
    : undefined
}

function getStatusParam(value: unknown): Reservation['status'] | undefined {
  return typeof value === 'string' && RESERVATION_STATUSES.includes(value as Reservation['status'])
    ? value as Reservation['status']
    : undefined
}

function getListFilters(query: Request['query']): ReservationListFilters {
  return {
    from: getDateParam(query.from),
    to: getDateParam(query.to),
    status: getStatusParam(query.status),
  }
}

function getOccupancyPeriod(query: Request['query']) {
  return {
    from: getDateParam(query.from),
    to: getDateParam(query.to),
  }
}

function isEmailTimeoutError(error: Error): boolean {
  const message = error.message.toLowerCase()
  const code = (error as Error & { code?: string }).code

  return code === 'ETIMEDOUT'
    || code === 'ESOCKET'
    || message.includes('timeout')
    || message.includes('timed out')
}

export async function list(req: Request, res: Response) {
  try {
    const filters = getListFilters(req.query)
    const reservations = await ReservationService.listReservations(filters)
    res.json(reservations)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function active(_req: Request, res: Response) {
  try {
    const reservations = await ReservationService.listActiveReservations()
    res.json(reservations)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function exportCsv(req: Request, res: Response) {
  try {
    const filters = getListFilters(req.query)
    const csv = await ReservationService.exportReservationsCsv(filters)
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', 'attachment; filename="reservations.csv"')
      .send(csv)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function occupancy(req: Request, res: Response) {
  try {
    const period = getOccupancyPeriod(req.query)
    const stats = await ReservationService.getOccupancyStats(period)
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function calendar(req: Request, res: Response) {
  try {
    const period = getOccupancyPeriod(req.query)
    const reservations = await ReservationService.getCalendarReservations(period)
    res.json(reservations)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const reservation = await ReservationService.getReservation(Number(req.params.id))
    res.json(reservation)
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const reservation = await ReservationService.createReservation(req.body)
    res.status(201).json(reservation)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const reservation = await ReservationService.updateReservation(
      Number(req.params.id),
      req.body
    )
    res.json(reservation)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
}

export async function sendEmail(req: Request, res: Response) {
  try {
    await ReservationService.sendReservationEmail(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    const error = err as Error
    const message = error.message
    const status = message.includes('não encontrada')
      ? 404
      : isEmailTimeoutError(error)
        ? 504
        : 500
    res.status(status).json({ error: message })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await ReservationService.deleteReservation(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
}
