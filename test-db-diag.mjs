import { createClient } from '@libsql/client'

const db = createClient({ url: 'file:studez.db' })

async function run() {
  const users = await db.execute("SELECT * FROM users WHERE email='student@campus.edu'")
  console.log('User:', users.rows[0])
  const lastMsgs = await db.execute("SELECT * FROM ai_messages ORDER BY created_at DESC LIMIT 5")
  console.log('Last messages:', lastMsgs.rows)
  const sessions = await db.execute("SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5")
  console.log('Sessions count:', sessions.rows.length, sessions.rows)
}

run().catch(console.error)
