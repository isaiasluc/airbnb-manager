import cron from 'node-cron'
import { getSyncStatus, runGmailSync } from './sync-status.service'

export function startGmailSyncCron(): void {
  cron.schedule('0 * * * *', async () => {
    if (getSyncStatus().isRunning) {
      console.log('[gmail-sync-cron] Sincronização ignorada: execução anterior em andamento')
      return
    }

    try {
      const result = await runGmailSync('cron')
      console.log(
        `[gmail-sync-cron] Última sincronização: ${new Date().toISOString()} ` +
        `imported=${result.imported} skipped=${result.skipped} errors=${result.errors.length}`
      )
    } catch (err) {
      console.error('[gmail-sync-cron] Falha na sincronização:', (err as Error).message)
    }
  })

  console.log('[gmail-sync-cron] Agendado para executar a cada 1h')
}
