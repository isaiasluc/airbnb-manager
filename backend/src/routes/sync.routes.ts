import { Router } from 'express'
import { syncGmailReservations } from '../services/gmail.service'

const router = Router()

router.post('/', async (_req, res) => {
  try {
    const result = await syncGmailReservations()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router