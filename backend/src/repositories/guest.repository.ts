import db from '../db'
import type { Guest } from '../types'

export async function findOrCreateGuest(
  first_name: string,
  last_name: string
): Promise<Guest> {
  const existing = await db<Guest>('guests')
    .where({ first_name, last_name })
    .first()

  if (existing) return existing

  const [created] = await db<Guest>('guests')
    .insert({ first_name, last_name })
    .returning('*')

  return created
}

export async function findGuestById(id: number): Promise<Guest | undefined> {
  return db<Guest>('guests').where({ id }).first()
}