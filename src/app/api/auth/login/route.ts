import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb, verifyPassword } from '@/lib/server/db'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/server/auth'
import type { UserRole } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const normalizedEmail = email.toLowerCase().trim()

    // 1. Query user from central users table
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    })

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 401 }
      )
    }

    const userRow = result.rows[0]

    // 2. Check account status
    if (userRow.account_status === 'inactive') {
      return NextResponse.json(
        { error: 'Your account has been deactivated by an administrator. Please contact your campus admin.' },
        { status: 403 }
      )
    }

    // 3. Verify password
    if (!userRow.password_hash) {
      return NextResponse.json(
        { error: 'Password not set for this account. Please sign in via Google or register.' },
        { status: 401 }
      )
    }

    const isValid = verifyPassword(password, String(userRow.password_hash))
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please verify and try again.' },
        { status: 401 }
      )
    }

    // 4. Role determination from central database
    const role = String(userRow.role) as UserRole
    let studentData: any = null
    let teacherData: any = null

    if (role === 'student') {
      const stuRes = await db.execute({
        sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
        args: [String(userRow.id)],
      })
      if (stuRes.rows.length > 0) {
        studentData = stuRes.rows[0]
      }
    } else if (role === 'teacher') {
      const teachRes = await db.execute({
        sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
        args: [String(userRow.id)],
      })
      if (teachRes.rows.length > 0) {
        teacherData = teachRes.rows[0]
      }
    }

    // 5. Create secure session in SQLite database
    const token = await createSession(String(userRow.id))

    // 6. Compute redirect target based on database role
    const redirectUrl = role === 'admin' ? '/admin' : '/dashboard'

    const userPayload = {
      id: String(userRow.id),
      email: String(userRow.email),
      full_name: String(userRow.full_name),
      role,
      avatar_url: userRow.profile_photo ? String(userRow.profile_photo) : null,
      department: studentData ? String(studentData.department) : (teacherData ? String(teacherData.department) : (userRow.department ? String(userRow.department) : null)),
      year: studentData ? studentData.year : (userRow.year ? String(userRow.year) : null),
      phone: studentData?.phone ? String(studentData.phone) : (teacherData?.phone ? String(teacherData.phone) : (userRow.phone ? String(userRow.phone) : null)),
      account_status: userRow.account_status || 'active',
      student: studentData || undefined,
      teacher: teacherData || undefined,
      created_at: String(userRow.created_at),
      updated_at: String(userRow.updated_at),
    }

    const response = NextResponse.json({
      success: true,
      user: userPayload,
      token,
      redirectUrl,
    })

    // 7. Set HTTP-Only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}
