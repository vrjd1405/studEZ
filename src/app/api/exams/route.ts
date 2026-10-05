import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    let query = `
      SELECT e.*, COALESCE(s.subject_name, s.name, 'Subject') as subject_name, COALESCE(s.subject_code, s.code, 'CODE') as subject_code
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      query += ` AND (e.subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = ?) OR e.subject_id IN (SELECT id FROM subjects WHERE department = ?))`
      args.push(user.id, user.student?.department || user.department || 'CSE')
    } else if (user.role === 'teacher') {
      query += ` AND (s.teacher_id = ? OR e.subject_id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?))`
      args.push(user.id, user.id)
    }

    query += ` ORDER BY e.date ASC, e.start_time ASC`

    const result = await db.execute({ sql: query, args })

    const exams = result.rows.map((row: any) => ({
      id: String(row.id),
      subject_id: String(row.subject_id),
      title: String(row.title),
      date: String(row.date),
      start_time: String(row.start_time),
      end_time: String(row.end_time),
      room: row.room ? String(row.room) : null,
      type: String(row.type) as 'midterm' | 'final' | 'quiz' | 'practical',
      max_marks: Number(row.max_marks || 100),
      created_at: String(row.created_at),
      subject: {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      }
    }))

    return NextResponse.json(exams)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only ADMIN or TEACHER can create exams
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const { subject_id, title, date, start_time, end_time, room, type, max_marks } = body

    if (!subject_id || !title || !date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Subject, title, date, start time, and end time are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `exam-${Date.now()}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO exams (id, subject_id, title, date, start_time, end_time, room, type, max_marks, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, subject_id, title, date, start_time, end_time,
        room || 'TBD', type || 'midterm', Number(max_marks) || 100, createdAt
      ],
    })

    return NextResponse.json({
      id,
      subject_id,
      title,
      date,
      start_time,
      end_time,
      room: room || 'TBD',
      type: type || 'midterm',
      max_marks: Number(max_marks) || 100,
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create exam' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM exams WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true, message: 'Exam deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete exam' }, { status: 500 })
  }
}
