import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb, hashPassword } from '@/lib/server/db'
import { requireRole } from '@/lib/server/auth'
import type { UserRole } from '@/types'

// GET /api/users
export async function GET(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin', 'teacher'])
    const db = getDb()
    const url = new URL(req.url)
    const roleFilter = url.searchParams.get('role')
    const search = url.searchParams.get('search')
    const department = url.searchParams.get('department')
    const year = url.searchParams.get('year')
    const section = url.searchParams.get('section')
    const status = url.searchParams.get('status')

    // Fetch users with outer joins on students and teachers
    let query = `
      SELECT 
        u.id, u.email, u.full_name, u.role, u.phone, u.profile_photo, u.account_status, u.created_at, u.updated_at,
        s.id as student_id, s.register_number, s.year as student_year, s.semester as student_semester,
        s.department as student_dept, s.section as student_section, s.batch as student_batch,
        s.admission_year as student_admission_year, s.college as student_college, s.status as student_status,
        t.id as teacher_id, t.employee_id, t.department as teacher_dept, t.designation as teacher_designation,
        t.subjects as teacher_subjects, t.status as teacher_status
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE 1=1
    `
    const args: any[] = []

    if (roleFilter) {
      query += ` AND u.role = ?`
      args.push(roleFilter)
    }

    if (status) {
      query += ` AND (u.account_status = ? OR s.status = ? OR t.status = ?)`
      args.push(status, status, status)
    }

    if (department && department !== 'all') {
      query += ` AND (s.department = ? OR t.department = ?)`
      args.push(department, department)
    }

    if (year && year !== 'all') {
      query += ` AND s.year = ?`
      args.push(year)
    }

    if (section && section !== 'all') {
      query += ` AND s.section = ?`
      args.push(section)
    }

    if (search) {
      const term = `%${search.trim()}%`
      query += ` AND (
        u.full_name LIKE ? OR 
        u.email LIKE ? OR 
        s.register_number LIKE ? OR 
        t.employee_id LIKE ? OR 
        s.department LIKE ? OR 
        t.department LIKE ?
      )`
      args.push(term, term, term, term, term, term)
    }

    query += ` ORDER BY u.created_at DESC`
    const result = await db.execute({ sql: query, args })

    const users = result.rows.map((row: any) => {
      const role = String(row.role) as UserRole
      const student = row.student_id ? {
        id: String(row.student_id),
        user_id: String(row.id),
        register_number: String(row.register_number),
        full_name: String(row.full_name),
        email: String(row.email),
        phone: row.phone ? String(row.phone) : null,
        year: String(row.student_year),
        semester: Number(row.student_semester || 1),
        department: String(row.student_dept),
        section: String(row.student_section),
        batch: row.student_batch ? String(row.student_batch) : null,
        admission_year: row.student_admission_year ? Number(row.student_admission_year) : null,
        college: row.student_college ? String(row.student_college) : null,
        profile_photo: row.profile_photo ? String(row.profile_photo) : null,
        status: (row.student_status as 'active' | 'inactive') || 'active',
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      } : undefined

      const teacher = row.teacher_id ? {
        id: String(row.teacher_id),
        user_id: String(row.id),
        employee_id: String(row.employee_id),
        full_name: String(row.full_name),
        email: String(row.email),
        phone: row.phone ? String(row.phone) : null,
        department: String(row.teacher_dept),
        designation: String(row.teacher_designation),
        subjects: row.teacher_subjects ? String(row.teacher_subjects) : null,
        profile_photo: row.profile_photo ? String(row.profile_photo) : null,
        status: (row.teacher_status as 'active' | 'inactive') || 'active',
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      } : undefined

      return {
        id: String(row.id),
        email: String(row.email),
        full_name: String(row.full_name),
        role,
        avatar_url: row.profile_photo ? String(row.profile_photo) : null,
        department: student ? student.department : (teacher ? teacher.department : null),
        year: student ? student.year : null,
        semester: student ? student.semester : null,
        section: student ? student.section : null,
        register_number: student ? student.register_number : null,
        employee_id: teacher ? teacher.employee_id : null,
        phone: row.phone ? String(row.phone) : null,
        account_status: (row.account_status as 'active' | 'inactive') || 'active',
        student,
        teacher,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }
    })

    return NextResponse.json(users)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users (Admin creates student, teacher, or admin)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const {
      role,
      full_name,
      email,
      password,
      phone,
      department,
      year,
      semester,
      section,
      register_number,
      employee_id,
      designation,
      subjects,
      batch,
      admission_year,
      college,
    } = body

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Email, full name, and role are required' }, { status: 400 })
    }

    const db = getDb()
    const normalizedEmail = email.toLowerCase().trim()

    // Uniqueness check
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const pwdHash = hashPassword(password || 'password123')
    const now = new Date().toISOString()

    // 1. Insert into users
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      args: [userId, normalizedEmail, pwdHash, role, full_name.trim(), phone || null, now, now],
    })

    // 2. Insert role-specific profile
    if (role === 'student') {
      const stuReg = register_number ? register_number.trim().toUpperCase() : `STU${Date.now().toString().slice(-4)}`
      const stuYear = year || '1st Year'
      const stuSem = semester ? parseInt(String(semester), 10) : 1
      const stuSec = section ? section.trim().toUpperCase() : 'A'
      const stuDept = department || 'CSE'
      const stuAdmYear = admission_year ? parseInt(String(admission_year), 10) : new Date().getFullYear()

      const studentId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.execute({
        sql: `INSERT INTO students (id, user_id, register_number, full_name, email, phone, year, semester, department, section, batch, admission_year, college, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [
          studentId,
          userId,
          stuReg,
          full_name.trim(),
          normalizedEmail,
          phone || null,
          stuYear,
          stuSem,
          stuDept,
          stuSec,
          batch || `${stuAdmYear}-${stuAdmYear + 4}`,
          stuAdmYear,
          college || 'Campus Institute of Technology',
          now,
          now,
        ],
      })
    } else if (role === 'teacher') {
      const empId = employee_id ? employee_id.trim().toUpperCase() : `FAC${Date.now().toString().slice(-4)}`
      const tchDept = department || 'CSE'
      const tchDesig = designation || 'Assistant Professor'
      const teacherId = `tch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      await db.execute({
        sql: `INSERT INTO teachers (id, user_id, employee_id, full_name, email, phone, department, designation, subjects, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        args: [
          teacherId,
          userId,
          empId,
          full_name.trim(),
          normalizedEmail,
          phone || null,
          tchDept,
          tchDesig,
          subjects ? (Array.isArray(subjects) ? subjects.join(', ') : subjects) : null,
          now,
          now,
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      id: userId,
      email: normalizedEmail,
      full_name,
      role,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    console.error('Error creating user:', err)
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 })
  }
}

// PATCH /api/users (Admin updates student or teacher details or toggles status)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const {
      id,
      full_name,
      email,
      phone,
      account_status,
      // Student specific
      department,
      year,
      semester,
      section,
      register_number,
      batch,
      // Teacher specific
      employee_id,
      designation,
      subjects,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const db = getDb()
    const now = new Date().toISOString()

    // 1. Fetch current user row
    const userRes = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      args: [id],
    })

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const current = userRes.rows[0]
    const role = String(current.role)

    // 2. Update users central table
    const updatedName = full_name !== undefined ? full_name.trim() : current.full_name
    const updatedEmail = email !== undefined ? email.toLowerCase().trim() : current.email
    const updatedPhone = phone !== undefined ? phone : current.phone
    const updatedStatus = account_status !== undefined ? account_status : (current.account_status || 'active')

    await db.execute({
      sql: `UPDATE users SET full_name = ?, email = ?, phone = ?, account_status = ?, updated_at = ? WHERE id = ?`,
      args: [updatedName, updatedEmail, updatedPhone, updatedStatus, now, id],
    })

    // 3. Update student table if student
    if (role === 'student') {
      const stuRes = await db.execute({
        sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
        args: [id],
      })
      if (stuRes.rows.length > 0) {
        const curStu = stuRes.rows[0]
        await db.execute({
          sql: `UPDATE students SET
                  full_name = ?,
                  email = ?,
                  phone = ?,
                  department = ?,
                  year = ?,
                  semester = ?,
                  section = ?,
                  register_number = ?,
                  batch = ?,
                  status = ?,
                  updated_at = ?
                WHERE user_id = ?`,
          args: [
            updatedName,
            updatedEmail,
            updatedPhone,
            department !== undefined ? department : curStu.department,
            year !== undefined ? year : curStu.year,
            semester !== undefined ? Number(semester) : curStu.semester,
            section !== undefined ? section : curStu.section,
            register_number !== undefined ? register_number : curStu.register_number,
            batch !== undefined ? batch : curStu.batch,
            updatedStatus,
            now,
            id,
          ],
        })
      }
    } else if (role === 'teacher') {
      const tchRes = await db.execute({
        sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
        args: [id],
      })
      if (tchRes.rows.length > 0) {
        const curTch = tchRes.rows[0]
        await db.execute({
          sql: `UPDATE teachers SET
                  full_name = ?,
                  email = ?,
                  phone = ?,
                  department = ?,
                  designation = ?,
                  subjects = ?,
                  employee_id = ?,
                  status = ?,
                  updated_at = ?
                WHERE user_id = ?`,
          args: [
            updatedName,
            updatedEmail,
            updatedPhone,
            department !== undefined ? department : curTch.department,
            designation !== undefined ? designation : curTch.designation,
            subjects !== undefined ? (Array.isArray(subjects) ? subjects.join(', ') : subjects) : curTch.subjects,
            employee_id !== undefined ? employee_id : curTch.employee_id,
            updatedStatus,
            now,
            id,
          ],
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User and academic profiles successfully updated in central database',
    })
  } catch (err: any) {
    if (err instanceof Response) return err
    console.error('Error updating user:', err)
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'User deleted from central database' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 })
  }
}
