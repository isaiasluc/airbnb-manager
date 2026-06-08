import { Router } from 'express'
import { getSyncStatus, runGmailSync } from '../services/sync-status.service'

const router = Router()

router.get('/', (_req, res) => {
  res.json(getSyncStatus())
})

router.post('/', async (_req, res) => {
  try {
    const result = await runGmailSync('manual')
    res.json({ ...result, syncStatus: getSyncStatus() })
  } catch (err) {
    const message = (err as Error).message
    const status = message === 'Sincronização já está em andamento' ? 409 : 500
    res.status(status).json({ error: message, syncStatus: getSyncStatus() })
  }
})

export default router
