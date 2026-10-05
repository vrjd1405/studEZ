import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    let query = `
      SELECT m.*, s.name as subject_name, s.code as subject_code, u.full_name as creator_name
      FROM meetings m
      LEFT JOIN subjects s ON m.subject_id = s.id
      JOIN users u ON m.created_by = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      // Students see campus-wide meetings (subject_id IS NULL) + meetings for their enrolled subjects
      query += ` AND (m.subject_id IS NULL OR m.subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = ?))`
      args.push(user.id)
    } else if (user.role === 'teacher') {
      // Teachers see campus meetings + their own meetings + their subject meetings
      query += ` AND (m.subject_id IS NULL OR m.created_by = ? OR m.subject_id IN (SELECT id FROM subjects WHERE teacher_id = ?))`
      args.push(user.id, user.id)
    }

    query += ` ORDER BY m.date ASC, m.time ASC`

    const result = await db.execute({ sql: query, args })

    const meetings = result.rows.map((row: any) => ({
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      subject_id: row.subject_id ? String(row.subject_id) : null,
      date: String(row.date),
      time: String(row.time),
      end_time: row.end_time ? String(row.end_time) : null,
      link: String(row.link),
      type: String(row.type) as 'class' | 'office_hours' | 'event' | 'other',
      status: String(row.status || 'scheduled'),
      created_by: String(row.created_by),
      created_at: String(row.created_at),
      creator: {
        id: String(row.created_by),
        full_name: String(row.creator_name),
      },
      subject: row.subject_name ? {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      } : undefined,
    }))

    return NextResponse.json(meetings)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // TEST 8 ENFORCEMENT: Only ADMIN and TEACHER can create meetings!
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const { title, description, subject_id, date, time, end_time, link, type } = body

    if (!title || !date || !time || !link) {
      return NextResponse.json({ error: 'Title, date, time, and meeting link are required' }, { status: 400 })
    }

    const db = getDb()

    // If teacher: if subject_id is specified, verify authorization
    if (user.role === 'teacher' && subject_id) {
      const subCheck = await db.execute({
        sql: 'SELECT id FROM subjects WHERE id = ? AND teacher_id = ?',
        args: [subject_id, user.id],
      })
      if (subCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Forbidden: You do not teach this subject' }, { status: 403 })
      }
    }

    const id = `meet-${Date.now()}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO meetings (id, title, description, subject_id, date, time, end_time, link, type, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
      args: [
        id, title, description || null, subject_id || null,
        date, time, end_time || null, link, type || 'class', user.id, createdAt
      ],
    })

    // Automatically send notification to students (TEST 5: "student receives notification")
    const notifId = `notif-meet-${Date.now()}`
    await db.execute({
      sql: `INSERT INTO notifications (id, title, message, type, target_role, user_id, created_by, read_by, created_at)
            VALUES (?, ?, ?, 'info', 'student', null, ?, '[]', ?)`,
      args: [
        notifId,
        `New Meeting: ${title}`,
        `A new meeting "${title}" has been scheduled for ${date} at ${time}. Click to join.`,
        user.id,
        createdAt,
      ],
    })

    return NextResponse.json({
      id,
      title,
      description: description || null,
      subject_id: subject_id || null,
      date,
      time,
      end_time: end_time || null,
      link,
      type: type || 'class',
      status: 'scheduled',
      created_by: user.id,
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create meeting' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    let id = url.searchParams.get('id')

    if (!id) {
      try {
        const body = await req.json()
        id = body.id
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
    }

    const db = getDb()
    if (user.role === 'admin') {
      await db.execute({ sql: 'DELETE FROM meetings WHERE id = ?', args: [id] })
    } else {
      await db.execute({ sql: 'DELETE FROM meetings WHERE id = ? AND created_by = ?', args: [id, user.id] })
    }

    return NextResponse.json({ success: true, message: 'Meeting deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete meeting' }, { status: 500 })
  }
}

