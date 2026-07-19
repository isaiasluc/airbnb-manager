import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { sendDueCheckinEmails } from '../services/reservation.service'
import { refreshReservationStatuses } from '../services/reservation-status.service'

const router = Router()

function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET não configurado no servidor' })
    return
  }

  const provided = req.headers['x-cron-secret']
  if (provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}

router.post('/checkin-emails', requireCronSecret, async (_req, res) => {
  try {
    const result = await sendDueCheckinEmails()
    console.log(`[cron-trigger] sent=${result.sent} failed=${result.failed}`)
    res.json(result)
  } catch (err) {
    console.error('[cron-trigger] Erro:', (err as Error).message)
    res.status(500).json({ error: (err as Error).message })
  }
})

router.post('/reservation-status', requireCronSecret, async (_req, res) => {
  try {
    const result = await refreshReservationStatuses()
    console.log(`[cron-trigger] status started=${result.started} completed=${result.completed}`)
    res.json(result)
  } catch (err) {
    console.error('[cron-trigger] Erro:', (err as Error).message)
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
