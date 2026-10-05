import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/server/db'
import { SESSION_COOKIE_NAME } from '@/lib/server/auth'

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      const db = getDb()
      await db.execute({
        sql: 'DELETE FROM sessions WHERE token = ?',
        args: [token],
      })
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' })
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Logout failed' }, { status: 500 })
  }
}
