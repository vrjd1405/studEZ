import { createClient } from '@libsql/client'
import { queryAIStudyAssistant } from './src/lib/server/ai-service.ts'

const db = createClient({ url: 'file:studez.db' })

async function run() {
  const users = await db.execute("SELECT * FROM users WHERE email='student@campus.edu'")
  const user = users.rows[0]
  console.log('Testing queryAIStudyAssistant for user:', user.email)
  try {
    const res = await queryAIStudyAssistant(
      user,
      [],
      'Generate a 3-question revision quiz on Database Normalization (1NF, 2NF, 3NF).',
      'gemma-2-9b'
    )
    console.log('Success reply:', res)
  } catch (err) {
    console.error('ERROR in queryAIStudyAssistant:', err)
  }
}

run()
