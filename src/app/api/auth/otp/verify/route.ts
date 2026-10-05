import { NextResponse } from 'next/server'
import { verifyOtpCode, createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 })
    }

    const { valid, user, error } = await verifyOtpCode(email, code)

    if (!valid || !user) {
      return NextResponse.json({ error: error || 'Invalid or expired verification code' }, { status: 400 })
    }

    const sessionToken = await createSession(user.id)

    const response = NextResponse.json({
      success: true,
      message: 'Email successfully verified. Welcome to studEZ!',
      user,
      sessionToken,
    })

    // Set HTTP session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    })

    return response
  } catch (err: any) {
    console.error('Error verifying OTP:', err)
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
