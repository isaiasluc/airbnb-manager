import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
dotenv.config()

import reservationRoutes from './routes/reservation.routes'
import syncRoutes        from './routes/sync.routes'
import { startGmailSyncCron } from './services/sync-cron.service'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/reservations', reservationRoutes)
app.use('/sync',         syncRoutes)

const PORT = process.env.PORT ?? 3000
app.listen(Number(PORT), '0.0.0.0', () =>
  console.log(`Backend rodando em http://localhost:${PORT}`)
)

startGmailSyncCron()
