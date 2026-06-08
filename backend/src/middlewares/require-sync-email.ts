import type { Request, Response, NextFunction } from 'express'
import type { FirebaseLocals } from './verify-firebase-token'

const DEFAULT_ALLOWED_SYNC_EMAIL = 'isaiiaslucena@gmail.com'

export function getAllowedSyncEmail() {
  return (process.env.SYNC_ALLOWED_EMAIL ?? DEFAULT_ALLOWED_SYNC_EMAIL).toLowerCase()
}

export function requireSyncEmail(
  _req: Request,
  res: Response<any, FirebaseLocals>,
  next: NextFunction,
) {
  const userEmail = res.locals.firebaseUser?.email?.toLowerCase()

  if (userEmail !== getAllowedSyncEmail()) {
    res.status(403).json({ error: 'Usuário sem permissão para sincronizar Gmail' })
    return
  }

  next()
}
