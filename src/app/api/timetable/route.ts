import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const dayFilter = url.searchParams.get('day')

    let query = `
      SELECT 
        tt.*, 
        s.subject_name, s.subject_code,
        u.full_name as teacher_name
      FROM timetable tt
      LEFT JOIN subjects s ON tt.subject_id = s.id
      LEFT JOIN users u ON tt.teacher_id = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      if (user.student) {
        query += ` AND (tt.department = 'all' OR tt.department = ?)
                   AND (tt.year = 'all' OR tt.year = ?)
                   AND (tt.section = 'all' OR tt.section = ?)`
        args.push(user.student.department, user.student.year, user.student.section)
      } else {
        query += ` AND tt.department = ?`
        args.push(user.department || 'CSE')
      }
    } else if (user.role === 'teacher') {
      query += ` AND (tt.teacher_id = ? OR tt.department = ?)`
      args.push(user.id, user.department || 'CSE')
    }

    if (dayFilter) {
      query += ` AND tt.day = ?`
      args.push(dayFilter)
    }

    query += ` ORDER BY tt.day ASC, tt.start_time ASC`
    const result = await db.execute({ sql: query, args })

    return NextResponse.json(result.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch timetable' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const {
      department,
      year,
      semester,
      section,
      subject_id,
      teacher_id,
      day,
      start_time,
      end_time,
      room,
    } = body

    if (!department || !year || !section || !subject_id || !day || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required timetable parameters' }, { status: 400 })
    }

    const db = getDb()
    const id = `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const finalTeacherId = teacher_id || user.id

    await db.execute({
      sql: `INSERT INTO timetable (id, department, year, semester, section, subject_id, teacher_id, day, start_time, end_time, room, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        department.trim(),
        year,
        semester ? Number(semester) : 1,
        section.trim().toUpperCase(),
        subject_id,
        finalTeacherId,
        day,
        start_time,
        end_time,
        room || 'Hall A',
        now,
      ],
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create timetable slot' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM timetable WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true, message: 'Timetable slot deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete slot' }, { status: 500 })
  }
}
