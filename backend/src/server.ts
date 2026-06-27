import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
dotenv.config()

import reservationRoutes from './routes/reservation.routes'
import syncRoutes        from './routes/sync.routes'
import googleAuthRoutes  from './routes/google-auth.routes'
import adminRoutes       from './routes/admin.routes'
import { verifyFirebaseToken } from './middlewares/verify-firebase-token'
import { requireSyncEmail } from './middlewares/require-sync-email'
import { startGmailSyncCron } from './services/sync-cron.service'
import { startCheckinEmailCron } from './services/checkin-email-cron.service'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/google-auth', googleAuthRoutes)
app.use('/reservations', verifyFirebaseToken, reservationRoutes)
app.use('/sync',         verifyFirebaseToken, requireSyncEmail, syncRoutes)
app.use('/admin',        verifyFirebaseToken, requireSyncEmail, adminRoutes)

const PORT = process.env.PORT ?? 3000
app.listen(Number(PORT), '0.0.0.0', () =>
  console.log(`Backend rodando em ====> http://localhost:${PORT}`)
)

startGmailSyncCron()
startCheckinEmailCron()
