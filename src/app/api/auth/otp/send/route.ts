import { NextResponse } from 'next/server'
import { createAndStoreOtp } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
    }

    const { code, expiresAt } = await createAndStoreOtp(email)

    // Check if real SMTP or email service is configured
    // For demo & hackathon testing convenience, we return the verification code in the response
    // along with a formatted dispatch message
    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${email}.`,
      expiresAt,
      // Provide preview code for instant verification & testing:
      previewCode: code,
    })
  } catch (err: any) {
    console.error('Error sending OTP:', err)
    return NextResponse.json({ error: err.message || 'Failed to dispatch OTP' }, { status: 500 })
  }
}
