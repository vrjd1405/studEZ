import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const reqStudentId = url.searchParams.get('student_id')
    const reqSubjectId = url.searchParams.get('subject_id')

    let query = `
      SELECT 
        a.id, a.student_id, a.subject_id, a.teacher_id, a.date, a.status, a.created_at,
        s.subject_name as name, s.subject_code as code,
        u.full_name as student_name,
        t.full_name as teacher_name
      FROM attendance a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN users t ON a.teacher_id = t.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      query += ` AND a.student_id = ?`
      args.push(user.id)
    } else if (user.role === 'teacher') {
      if (reqStudentId) {
        query += ` AND a.student_id = ?`
        args.push(reqStudentId)
      } else {
        query += ` AND a.teacher_id = ?`
        args.push(user.id)
      }
    } else {
      if (reqStudentId) {
        query += ` AND a.student_id = ?`
        args.push(reqStudentId)
      }
    }

    if (reqSubjectId) {
      query += ` AND a.subject_id = ?`
      args.push(reqSubjectId)
    }

    query += ` ORDER BY a.date DESC, a.created_at DESC`
    const result = await db.execute({ sql: query, args })

    const attendanceRecords = result.rows.map((row: any) => ({
      id: String(row.id),
      student_id: String(row.student_id),
      subject_id: String(row.subject_id),
      teacher_id: String(row.teacher_id),
      date: String(row.date),
      status: String(row.status) as 'present' | 'absent' | 'late',
      created_at: String(row.created_at),
      subject: {
        id: String(row.subject_id),
        name: row.name ? String(row.name) : 'Subject',
        code: row.code ? String(row.code) : 'CODE',
      },
      student: {
        id: String(row.student_id),
        full_name: row.student_name ? String(row.student_name) : 'Student',
      },
      teacher: {
        id: String(row.teacher_id),
        full_name: row.teacher_name ? String(row.teacher_name) : 'Teacher',
      }
    }))

    return NextResponse.json(attendanceRecords)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch attendance' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['teacher', 'admin'])
    const body = await req.json()
    const { student_id, subject_id, date, status } = body

    if (!student_id || !subject_id || !date || !status) {
      return NextResponse.json({ error: 'Missing required attendance fields (student_id, subject_id, date, status)' }, { status: 400 })
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return NextResponse.json({ error: 'Status must be present, absent, or late' }, { status: 400 })
    }

    const db = getDb()
    const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO attendance (id, student_id, subject_id, teacher_id, date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, student_id, subject_id, user.id, date, status, createdAt],
    })

    return NextResponse.json({
      success: true,
      attendance: {
        id,
        student_id,
        subject_id,
        teacher_id: user.id,
        date,
        status,
        created_at: createdAt,
      }
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to mark attendance' }, { status: 500 })
  }
}
