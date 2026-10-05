import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Session lookup failed' }, { status: 500 })
  }
}
