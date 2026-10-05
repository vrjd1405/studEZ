import { NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/server/auth'
import type { UserRole, Profile } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, fullName, photoUrl } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required from Google Auth' }, { status: 400 })
    }

    const db = getDb()
    const normalizedEmail = email.toLowerCase().trim()

    // 1. Query if user exists in central users table
    const userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    })

    const now = new Date().toISOString()
    let userId: string
    let userRole: UserRole
    let studentData: any = null
    let teacherData: any = null
    let userRecord: any

    if (userResult.rows.length === 0) {
      // 2. New Google user
      userId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      userRole = 'student'
      let name = fullName?.trim() || normalizedEmail.split('@')[0].replace(/[._]/g, ' ')
      name = name.charAt(0).toUpperCase() + name.slice(1)

      if (normalizedEmail.includes('admin')) {
        userRole = 'admin'
      } else if (
        normalizedEmail.includes('prof') ||
        normalizedEmail.includes('teacher') ||
        normalizedEmail.includes('faculty')
      ) {
        userRole = 'teacher'
      }

      // Insert central user
      await db.execute({
        sql: `INSERT INTO users (id, email, role, full_name, profile_photo, avatar_url, account_status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [userId, normalizedEmail, userRole, name, photoUrl || null, photoUrl || null, now, now],
      })

      // Insert role-specific profile
      if (userRole === 'student') {
        const studentId = `stu_g_${Date.now()}`
        const regNo = `REG${new Date().getFullYear()}CS${Math.floor(100 + Math.random() * 900)}`
        await db.execute({
          sql: `INSERT INTO students (id, user_id, register_number, full_name, email, year, semester, department, section, batch, admission_year, college, profile_photo, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, '1st Year', 1, 'CSE', 'A', '2024-2028', 2024, 'Campus Institute of Technology', ?, 'active', ?, ?)`,
          args: [studentId, userId, regNo, name, normalizedEmail, photoUrl || null, now, now],
        })

        const sRes = await db.execute({
          sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
          args: [userId],
        })
        studentData = sRes.rows[0]
      } else if (userRole === 'teacher') {
        const teacherId = `tch_g_${Date.now()}`
        const empId = `FAC${Math.floor(100 + Math.random() * 900)}`
        await db.execute({
          sql: `INSERT INTO teachers (id, user_id, employee_id, full_name, email, department, designation, profile_photo, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'CSE', 'Assistant Professor', ?, 'active', ?, ?)`,
          args: [teacherId, userId, empId, name, normalizedEmail, photoUrl || null, now, now],
        })

        const tRes = await db.execute({
          sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
          args: [userId],
        })
        teacherData = tRes.rows[0]
      }

      userRecord = {
        id: userId,
        email: normalizedEmail,
        full_name: name,
        role: userRole,
        profile_photo: photoUrl || null,
        account_status: 'active',
        created_at: now,
        updated_at: now,
      }
    } else {
      // 3. Existing User
      userRecord = userResult.rows[0]
      userId = String(userRecord.id)
      userRole = String(userRecord.role) as UserRole

      // Check account status
      if (userRecord.account_status === 'inactive') {
        return NextResponse.json(
          { error: 'Your account has been deactivated by an administrator. Please contact campus admin.' },
          { status: 403 }
        )
      }

      // Update photo if provided and missing
      if (photoUrl && !userRecord.profile_photo) {
        try {
          await db.execute({
            sql: 'UPDATE users SET profile_photo = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
            args: [photoUrl, photoUrl, now, userId],
          })
        } catch {}
      }

      // Fetch relational student or teacher details
      if (userRole === 'student') {
        const sRes = await db.execute({
          sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
          args: [userId],
        })
        if (sRes.rows.length > 0) studentData = sRes.rows[0]
      } else if (userRole === 'teacher') {
        const tRes = await db.execute({
          sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
          args: [userId],
        })
        if (tRes.rows.length > 0) teacherData = tRes.rows[0]
      }
    }

    // 4. Create server session
    const sessionToken = await createSession(userId)

    const userPayload: Profile = {
      id: userId,
      email: normalizedEmail,
      full_name: String(userRecord.full_name),
      role: userRole,
      avatar_url: photoUrl || (userRecord.profile_photo ? String(userRecord.profile_photo) : null),
      department: studentData ? String(studentData.department) : (teacherData ? String(teacherData.department) : null),
      year: studentData ? studentData.year : null,
      phone: studentData?.phone ? String(studentData.phone) : (teacherData?.phone ? String(teacherData.phone) : (userRecord.phone ? String(userRecord.phone) : null)),
      account_status: (userRecord.account_status as 'active' | 'inactive') || 'active',
      student: studentData ? {
        id: String(studentData.id),
        user_id: userId,
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
        user_id: userId,
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
      created_at: String(userRecord.created_at),
      updated_at: String(userRecord.updated_at),
    }

    const redirectUrl = userRole === 'admin' ? '/admin' : '/dashboard'

    const response = NextResponse.json({
      success: true,
      message: `Signed in successfully as ${userPayload.full_name}`,
      user: userPayload,
      sessionToken,
      redirectUrl,
    })

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
    console.error('Error handling Firebase Google login:', err)
    return NextResponse.json({ error: err.message || 'Google sign-in failed' }, { status: 500 })
  }
}
