import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb, hashPassword } from '@/lib/server/db'
import { createSession, SESSION_COOKIE_NAME } from '@/lib/server/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      role,
      full_name,
      email,
      password,
      confirm_password,
      phone,
      // Student specific
      register_number,
      department,
      year,
      semester,
      section,
      batch,
      admission_year,
      college,
      // Teacher specific
      employee_id,
      designation,
      subjects,
      profile_photo,
    } = body

    // 1. Basic validation
    if (!role || !['student', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid registration role. Admin accounts cannot be publicly registered.' },
        { status: 400 }
      )
    }

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required fields.' },
        { status: 400 }
      )
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    const db = getDb()
    const normalizedEmail = email.toLowerCase().trim()

    // 2. Check if email already registered
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    })

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 400 }
      )
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const pwdHash = hashPassword(password)
    const now = new Date().toISOString()

    if (role === 'student') {
      if (!register_number || !department || !year || !section) {
        return NextResponse.json(
          { error: 'Register number, department, year, and section are required for student registration.' },
          { status: 400 }
        )
      }

      // Check register_number uniqueness
      const regCheck = await db.execute({
        sql: 'SELECT id FROM students WHERE register_number = ? LIMIT 1',
        args: [register_number.trim().toUpperCase()],
      })
      if (regCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `Register Number '${register_number}' is already taken.` },
          { status: 400 }
        )
      }

      const studentId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const semNum = semester ? parseInt(String(semester), 10) : 1
      const admYear = admission_year ? parseInt(String(admission_year), 10) : new Date().getFullYear()

      // Insert central user
      await db.execute({
        sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, profile_photo, account_status, created_at, updated_at)
              VALUES (?, ?, ?, 'student', ?, ?, ?, 'active', ?, ?)`,
        args: [userId, normalizedEmail, pwdHash, full_name.trim(), phone || null, profile_photo || null, now, now],
      })

      // Insert student record
      await db.execute({
        sql: `INSERT INTO students (id, user_id, register_number, full_name, email, phone, year, semester, department, section, batch, admission_year, college, profile_photo, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [
          studentId,
          userId,
          register_number.trim().toUpperCase(),
          full_name.trim(),
          normalizedEmail,
          phone || null,
          year,
          semNum,
          department.trim(),
          section.trim().toUpperCase(),
          batch || `${admYear}-${admYear + 4}`,
          admYear,
          college || 'Campus Institute of Technology',
          profile_photo || null,
          now,
          now,
        ],
      })
    } else if (role === 'teacher') {
      if (!employee_id || !department || !designation) {
        return NextResponse.json(
          { error: 'Employee ID, department, and designation are required for teacher registration.' },
          { status: 400 }
        )
      }

      // Check employee_id uniqueness
      const empCheck = await db.execute({
        sql: 'SELECT id FROM teachers WHERE employee_id = ? LIMIT 1',
        args: [employee_id.trim().toUpperCase()],
      })
      if (empCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `Employee ID '${employee_id}' is already registered.` },
          { status: 400 }
        )
      }

      const teacherId = `tch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      // Insert central user
      await db.execute({
        sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, profile_photo, account_status, created_at, updated_at)
              VALUES (?, ?, ?, 'teacher', ?, ?, ?, 'active', ?, ?)`,
        args: [userId, normalizedEmail, pwdHash, full_name.trim(), phone || null, profile_photo || null, now, now],
      })

      // Insert teacher record
      await db.execute({
        sql: `INSERT INTO teachers (id, user_id, employee_id, full_name, email, phone, department, designation, subjects, profile_photo, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [
          teacherId,
          userId,
          employee_id.trim().toUpperCase(),
          full_name.trim(),
          normalizedEmail,
          phone || null,
          department.trim(),
          designation.trim(),
          subjects ? (Array.isArray(subjects) ? subjects.join(', ') : subjects) : null,
          profile_photo || null,
          now,
          now,
        ],
      })
    }

    // 3. Create session and login automatically
    const token = await createSession(userId)

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully registered!',
      redirectUrl: '/dashboard',
      token,
    })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
