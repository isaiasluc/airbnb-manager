import type { Request, Response } from 'express'
import * as ReservationService from '../services/reservation.service'
import type { ReservationListFilters } from '../types'

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function getDateParam(value: unknown): string | undefined {
  return typeof value === 'string' && DATE_PARAM_PATTERN.test(value)
    ? value
    : undefined
}

export async function list(req: Request, res: Response) {
  try {
    const filters: ReservationListFilters = {
      from: getDateParam(req.query.from),
      to: getDateParam(req.query.to),
    }
    const reservations = await ReservationService.listReservations(filters)
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

export async function remove(req: Request, res: Response) {
  try {
    await ReservationService.deleteReservation(Number(req.params.id))
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
}
