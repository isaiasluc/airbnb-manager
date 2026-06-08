import type { Request, Response, NextFunction } from 'express'
import { firebaseAuth } from '../services/firebase-admin'

function getBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = getBearerToken(req.header('Authorization'))

  if (!token) {
    res.status(401).json({ error: 'Token Firebase ausente' })
    return
  }

  try {
    await firebaseAuth.verifyIdToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Token Firebase inválido' })
  }
}
