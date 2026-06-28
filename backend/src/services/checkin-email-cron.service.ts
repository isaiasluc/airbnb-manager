import cron from 'node-cron'
import { sendDueCheckinEmails } from './reservation.service'

export function startCheckinEmailCron(): void {
  cron.schedule('0 8 * * *', async () => {
    try {
      const result = await sendDueCheckinEmails()
      console.log(
        `[checkin-email-cron] Última execução: ${new Date().toISOString()} ` +
        `sent=${result.sent} failed=${result.failed}`
      )

      for (const error of result.errors) {
        console.error(
          `[checkin-email-cron] Falha ao enviar email da reserva ${error.reservationId}: ${error.message}`
        )
      }
    } catch (err) {
      console.error('[checkin-email-cron] Falha na execução:', (err as Error).message)
    }
  }, { timezone: 'America/Sao_Paulo' })

  console.log('[checkin-email-cron] Agendado para executar diariamente às 08:00 (America/Sao_Paulo)')
}
