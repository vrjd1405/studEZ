import { getDb } from './db'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { UserRole, Profile } from '@/types'

export const SESSION_COOKIE_NAME = 'studez_session'
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthenticatedUser extends Profile {
  sessionId: string
}

// Generate secure 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create and store an OTP in SQLite database
export async function createAndStoreOtp(email: string): Promise<{ code: string; expiresAt: number }> {
  const db = getDb()
  const code = generateOtp()
  const now = Date.now()
  const expiresAt = now + 10 * 60 * 1000 // 10 minutes
  const id = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  // Invalidate previous unexpired OTPs for this email
  await db.execute({
    sql: 'UPDATE otps SET used = 1 WHERE email = ? AND used = 0',
    args: [email.toLowerCase().trim()],
  })

  // Insert fresh OTP
  await db.execute({
    sql: 'INSERT INTO otps (id, email, code, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    args: [id, email.toLowerCase().trim(), code, expiresAt, new Date().toISOString()],
  })

  return { code, expiresAt }
}

// Verify OTP
export async function verifyOtpCode(email: string, code: string): Promise<{ valid: boolean; user?: Profile; error?: string }> {
  const db = getDb()
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedCode = code.trim()
  const now = Date.now()

  // Query latest OTP for this email
  const result = await db.execute({
    sql: `SELECT * FROM otps 
          WHERE email = ? AND code = ? AND used = 0 AND expires_at > ? 
          ORDER BY expires_at DESC LIMIT 1`,
    args: [normalizedEmail, normalizedCode, now],
  })

  if (result.rows.length === 0) {
    return { valid: false, error: 'Invalid or expired verification code' }
  }

  const otpRow = result.rows[0]
  // Mark OTP as used
  await db.execute({
    sql: 'UPDATE otps SET used = 1 WHERE id = ?',
    args: [String(otpRow.id)],
  })

  // Find or create user profile
  let userResult = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [normalizedEmail],
  })

  let user: Profile

  if (userResult.rows.length === 0) {
    // New user detected: infer initial role from campus email or default to student
    let role: UserRole = 'student'
    let fullName = normalizedEmail.split('@')[0].replace(/[._]/g, ' ')
    fullName = fullName.charAt(0).toUpperCase() + fullName.slice(1)

    if (normalizedEmail.includes('admin')) {
      role = 'admin'
      fullName = 'Campus Administrator'
    } else if (normalizedEmail.includes('prof') || normalizedEmail.includes('teacher') || normalizedEmail.includes('faculty')) {
      role = 'teacher'
      fullName = 'Faculty Member'
    }

    const userId = `user-${Date.now()}`
    const timestamp = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO users (id, email, full_name, role, profile_photo, account_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, null, 'active', ?, ?)`,
      args: [userId, normalizedEmail, fullName, role, timestamp, timestamp],
    })

    user = {
      id: userId,
      email: normalizedEmail,
      full_name: fullName,
      role,
      avatar_url: null,
      department: 'Computer Science',
      year: 1,
      phone: null,
      created_at: timestamp,
      updated_at: timestamp,
    }
  } else {
    const row = userResult.rows[0]
    user = {
      id: String(row.id),
      email: String(row.email),
      full_name: String(row.full_name),
      role: String(row.role) as UserRole,
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      department: row.department ? String(row.department) : null,
      year: row.year ? Number(row.year) : null,
      phone: row.phone ? String(row.phone) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }
  }

  return { valid: true, user }
}

// Create server session token
export async function createSession(userId: string): Promise<string> {
  const db = getDb()
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const expiresAt = Date.now() + SESSION_DURATION_MS

  await db.execute({
    sql: 'INSERT INTO sessions (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [sessionId, token, userId, expiresAt, new Date().toISOString()],
  })

  return token
}

// Get authenticated user from request or cookie
export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  const db = getDb()
  let token: string | undefined

  if (req) {
    // 1. Check Authorization header
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    // 2. Check cookie on request
    if (!token) {
      token = req.cookies.get(SESSION_COOKIE_NAME)?.value
    }
  }

  // 3. Check next/headers cookies if available
  if (!token) {
    try {
      const cookieStore = cookies()
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    } catch {
      // Not in request context
    }
  }

  if (!token) {
    return null
  }

  const now = Date.now()
  const result = await db.execute({
    sql: `SELECT s.id as session_id, u.* 
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND s.expires_at > ?
          LIMIT 1`,
    args: [token, now],
  })

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  const userRole = String(row.role) as UserRole
  let studentData: any = undefined
  let teacherData: any = undefined

  if (userRole === 'student') {
    const studentRes = await db.execute({
      sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
      args: [String(row.id)],
    })
    if (studentRes.rows.length > 0) {
      studentData = studentRes.rows[0]
    }
  } else if (userRole === 'teacher') {
    const teacherRes = await db.execute({
      sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
      args: [String(row.id)],
    })
    if (teacherRes.rows.length > 0) {
      teacherData = teacherRes.rows[0]
    }
  }

  return {
    sessionId: String(row.session_id),
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: userRole,
    avatar_url: row.profile_photo ? String(row.profile_photo) : (row.avatar_url ? String(row.avatar_url) : null),
    department: studentData ? String(studentData.department) : (teacherData ? String(teacherData.department) : (row.department ? String(row.department) : null)),
    year: studentData ? studentData.year : (row.year ? String(row.year) : null),
    phone: studentData?.phone ? String(studentData.phone) : (teacherData?.phone ? String(teacherData.phone) : (row.phone ? String(row.phone) : null)),
    account_status: (row.account_status as 'active' | 'inactive') || 'active',
    student: studentData ? {
      id: String(studentData.id),
      user_id: String(studentData.user_id),
      register_number: String(studentData.register_number),
      full_name: String(studentData.full_name),
      email: String(studentData.email),
      phone: studentData.phone ? String(studentData.phone) : null,
      year: String(studentData.year),
      semester: Number(studentData.semester),
      department: String(studentData.department),
      section: String(studentData.section),
      batch: studentData.batch ? String(studentData.batch) : null,
      admission_year: studentData.admission_year ? Number(studentData.admission_year) : null,
      college: studentData.college ? String(studentData.college) : null,
      profile_photo: studentData.profile_photo ? String(studentData.profile_photo) : null,
      status: (studentData.status as 'active' | 'inactive') || 'active',
      created_at: String(studentData.created_at),
      updated_at: String(studentData.updated_at),
    } : undefined,
    teacher: teacherData ? {
      id: String(teacherData.id),
      user_id: String(teacherData.user_id),
      employee_id: String(teacherData.employee_id),
      full_name: String(teacherData.full_name),
      email: String(teacherData.email),
      phone: teacherData.phone ? String(teacherData.phone) : null,
      department: String(teacherData.department),
      designation: String(teacherData.designation),
      subjects: teacherData.subjects ? String(teacherData.subjects) : null,
      profile_photo: teacherData.profile_photo ? String(teacherData.profile_photo) : null,
      status: (teacherData.status as 'active' | 'inactive') || 'active',
      created_at: String(teacherData.created_at),
      updated_at: String(teacherData.updated_at),
    } : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

// Strict Authorization Enforcers
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized: Authentication required. Please verify email OTP.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return user
}

export async function requireRole(req: NextRequest, allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuth(req)
  if (!allowedRoles.includes(user.role)) {
    throw new Response(
      JSON.stringify({ 
        error: `Forbidden: Access restricted. Role '${user.role}' is not authorized for this academic operation.` 
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return user
}
