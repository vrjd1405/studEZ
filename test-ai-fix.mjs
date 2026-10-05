import { createClient } from '@libsql/client'
import { queryAIStudyAssistant } from './src/lib/server/ai-service.ts'

const db = createClient({ url: 'file:studez.db' })

async function run() {
  const users = await db.execute("SELECT * FROM users WHERE email='student@campus.edu'")
  const user = users.rows[0]
  console.log('Testing user:', user.email)
  const res = await queryAIStudyAssistant(
    user,
    [],
    'Generate a 3-question revision quiz on Database Normalization (1NF, 2NF, 3NF).',
    'gemma-2-9b'
  )
  console.log('--- TEST RESULT ---')
  console.log('Provider:', res.provider)
  console.log('Model:', res.model)
  console.log('Reply preview:\n', res.reply.slice(0, 300))
}

run().catch(console.error)
