import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    let query = `
      SELECT e.*, s.name as subject_name, s.code as subject_code, u.full_name as student_name, u.email as student_email
      FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      JOIN users u ON e.student_id = u.id
    `
    const args: any[] = []

    if (user.role === 'student') {
      query += ` WHERE e.student_id = ?`
      args.push(user.id)
    } else if (user.role === 'teacher') {
      query += ` WHERE s.teacher_id = ?`
      args.push(user.id)
    }

    const result = await db.execute({ sql: query, args })
    return NextResponse.json(result.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch enrollments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only ADMIN can enroll students
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const { student_id, subject_id, semester } = body

    if (!student_id || !subject_id) {
      return NextResponse.json({ error: 'student_id and subject_id are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `enr-${Date.now()}`
    const enrolledAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, subject_id) DO NOTHING`,
      args: [id, student_id, subject_id, Number(semester) || 1, enrolledAt],
    })

    return NextResponse.json({ success: true, id, student_id, subject_id }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to enroll student' }, { status: 500 })
  }
}
