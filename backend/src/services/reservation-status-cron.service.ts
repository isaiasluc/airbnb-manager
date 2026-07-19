import cron from 'node-cron'
import { refreshReservationStatuses } from './reservation-status.service'

async function runRefresh(trigger: string): Promise<void> {
  try {
    const result = await refreshReservationStatuses()
    console.log(
      `[reservation-status-cron] ${trigger}: started=${result.started} completed=${result.completed}`,
    )
  } catch (err) {
    console.error('[reservation-status-cron] Falha ao atualizar status:', (err as Error).message)
  }
}

export function startReservationStatusCron(): void {
  // De hora em hora — o status vira em andamento/concluída perto do horário real
  // de check-in (15h) e checkout (11h). Comparação por timestamp absoluto, então
  // o timezone do agendamento é irrelevante.
  cron.schedule('0 * * * *', () => runRefresh('cron'))

  // Executa uma vez no startup para atualizar logo após o deploy.
  void runRefresh('startup')

  console.log('[reservation-status-cron] Agendado para executar a cada 1h')
}
