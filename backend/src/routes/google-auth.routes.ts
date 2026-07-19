import { Router } from 'express'
import {
  consumeGoogleAuthState,
  createGoogleAuthUrl,
  createGoogleOAuthClient,
  getAuthenticatedGmailAddress,
  hasGoogleToken,
  isGoogleTokenInvalid,
  saveGoogleToken,
} from '../services/google-auth.service'
import { verifyFirebaseToken } from '../middlewares/verify-firebase-token'
import { getAllowedSyncEmail, requireSyncEmail } from '../middlewares/require-sync-email'

const router = Router()

function getFrontendUrl(path = '/') {
  const base = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  return new URL(path, base).toString()
}

router.get('/status', verifyFirebaseToken, requireSyncEmail, async (_req, res) => {
  res.json({ authenticated: (await hasGoogleToken()) && !isGoogleTokenInvalid() })
})

router.post('/start', verifyFirebaseToken, requireSyncEmail, (_req, res) => {
  try {
    res.json({ authUrl: createGoogleAuthUrl() })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : null
  const state = typeof req.query.state === 'string' ? req.query.state : null

  if (!code || !state || !consumeGoogleAuthState(state)) {
    res.redirect(getFrontendUrl('/?googleAuth=error'))
    return
  }

  try {
    const client = createGoogleOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const googleEmail = await getAuthenticatedGmailAddress(client)
    if (googleEmail !== getAllowedSyncEmail()) {
      res.redirect(getFrontendUrl('/?googleAuth=wrongEmail'))
      return
    }

    await saveGoogleToken(tokens)
    res.redirect(getFrontendUrl('/?googleAuth=success'))
  } catch {
    res.redirect(getFrontendUrl('/?googleAuth=error'))
  }
})

export default router
