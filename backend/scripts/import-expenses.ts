/**
 * Roda UMA VEZ para importar o histórico de despesas da planilha
 * "AirBnB Controle de Gastos" (aba Despesas) para o banco.
 * Uso: npx tsx scripts/import-expenses.ts
 */
import fs from 'fs'
import path from 'path'
import db from '../src/db'
import type { Expense } from '../src/types'

type SeedExpense = {
  description: string
  category: Expense['category']
  amount: number
  expense_date: string
  status: Expense['status']
  paid_at: string | null
}

async function main() {
  const seedPath = path.join(__dirname, 'data', 'expenses-seed.json')
  const seed: SeedExpense[] = JSON.parse(fs.readFileSync(seedPath, 'utf8'))

  const [{ count }] = await db('expenses').count<{ count: string }[]>('id as count')
  if (Number(count) > 0) {
    console.log(`⚠️  A tabela "expenses" já tem ${count} linha(s). Nada foi importado.`)
    console.log('   Para reimportar, esvazie a tabela antes (TRUNCATE expenses).')
    process.exit(0)
  }

  await db('expenses').insert(seed)
  console.log(`✅ ${seed.length} despesas importadas.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Erro ao importar despesas:', err)
  process.exit(1)
})
