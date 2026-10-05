import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const subjectIdFilter = url.searchParams.get('subject_id')

    let query = `
      SELECT 
        n.id, n.title, n.description, n.file_url, n.subject_id, n.teacher_id,
        n.department, n.year, n.semester, n.section, n.created_at, n.updated_at,
        s.subject_code, s.subject_name,
        u.full_name as teacher_name
      FROM notes n
      LEFT JOIN subjects s ON n.subject_id = s.id
      LEFT JOIN users u ON n.teacher_id = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      // Content targeting for student
      if (user.student) {
        query += ` AND (n.department = 'all' OR n.department = ?)
                   AND (n.year = 'all' OR n.year = ?)
                   AND (n.section = 'all' OR n.section = ?)`
        args.push(user.student.department, user.student.year, user.student.section)
      } else {
        query += ` AND n.department = ?`
        args.push(user.department || 'CSE')
      }
    } else if (user.role === 'teacher') {
      // Teachers view notes they created or departmental notes
      query += ` AND (n.teacher_id = ? OR n.department = ?)`
      args.push(user.id, user.department || 'CSE')
    }
    // Admin sees all

    if (subjectIdFilter) {
      query += ` AND n.subject_id = ?`
      args.push(subjectIdFilter)
    }

    query += ` ORDER BY n.created_at DESC`
    const result = await db.execute({ sql: query, args })

    const notes = result.rows.map((row: any) => ({
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      file_url: String(row.file_url),
      subject_id: String(row.subject_id),
      teacher_id: String(row.teacher_id),
      department: String(row.department),
      year: String(row.year),
      semester: Number(row.semester),
      section: String(row.section),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      subject_code: row.subject_code ? String(row.subject_code) : undefined,
      subject_name: row.subject_name ? String(row.subject_name) : undefined,
      teacher_name: row.teacher_name ? String(row.teacher_name) : undefined,
    }))

    return NextResponse.json(notes)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['teacher', 'admin'])
    const body = await req.json()
    const {
      title,
      description,
      file_url,
      subject_id,
      department,
      year,
      semester,
      section,
    } = body

    if (!title || !subject_id) {
      return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const finalDept = (department || user.department || 'CSE').trim()
    const finalYear = year || '1st Year'
    const finalSem = semester ? Number(semester) : 1
    const finalSec = (section || 'A').trim().toUpperCase()
    const finalUrl = file_url || `/uploads/notes/${id}.pdf`

    await db.execute({
      sql: `INSERT INTO notes (id, title, description, file_url, subject_id, teacher_id, department, year, semester, section, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title.trim(),
        description || null,
        finalUrl,
        subject_id,
        user.id,
        finalDept,
        finalYear,
        finalSem,
        finalSec,
        now,
        now,
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Note uploaded and targeted successfully',
      id,
      title,
      department: finalDept,
      year: finalYear,
      section: finalSec,
      file_url: finalUrl,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to upload note' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['teacher', 'admin'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM notes WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Note deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete note' }, { status: 500 })
  }
}
