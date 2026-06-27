import { Router } from 'express'
import { sendDueCheckinEmails } from '../services/reservation.service'

const router = Router()

router.post('/checkin-emails/trigger', async (_req, res) => {
  try {
    const result = await sendDueCheckinEmails()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
