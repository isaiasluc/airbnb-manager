import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
dotenv.config()

import reservationRoutes from './routes/reservation.routes';

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/reservations', reservationRoutes)

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`))