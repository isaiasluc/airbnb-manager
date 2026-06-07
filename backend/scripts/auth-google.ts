/**
 * Roda UMA VEZ para gerar o google-token.json
 * Uso: npx tsx scripts/auth-google.ts
 */
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { google } from 'googleapis'
import * as dotenv from 'dotenv'
dotenv.config()

const TOKEN_PATH = path.resolve(process.env.GOOGLE_TOKEN_PATH ?? './google-token.json')

const client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
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
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))
    console.log('\n✅ Token salvo em', TOKEN_PATH)
    console.log('Agora pode rodar: curl -X POST http://127.0.0.1:3000/sync\n')
  } catch (err) {
    console.error('❌ Erro ao trocar o código pelo token:', err)
  }
  process.exit(0)
})