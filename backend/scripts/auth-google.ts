/**
 * Roda UMA VEZ para gerar o token do Google fora do fluxo web
 * Uso: npx tsx scripts/auth-google.ts
 */
import readline from 'readline'
import * as dotenv from 'dotenv'
import {
  GMAIL_READONLY_SCOPE,
  createGoogleOAuthClient,
  saveGoogleToken,
} from '../src/services/google-auth.service'
dotenv.config()

const client = createGoogleOAuthClient()

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: [GMAIL_READONLY_SCOPE],
  prompt: 'consent', // força retorno do refresh_token
})

console.log('\n🔐 Acesse esta URL no browser:\n')
console.log(authUrl)
console.log()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('Cole o código de autorização aqui: ', async (code) => {
  rl.close()
  try {
    const { tokens } = await client.getToken(code.trim())
    await saveGoogleToken(tokens)
    console.log('\n✅ Token salvo no Secret Manager')
    console.log('Agora pode rodar: curl -X POST http://127.0.0.1:3000/sync\n')
  } catch (err) {
    console.error('❌ Erro ao trocar o código pelo token:', err)
  }
  process.exit(0)
})
