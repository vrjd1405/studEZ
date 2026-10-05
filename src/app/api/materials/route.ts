import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const reqSubjectId = url.searchParams.get('subject_id')

    let query = `
      SELECT m.*, COALESCE(s.subject_name, s.name, 'Subject') as subject_name, COALESCE(s.subject_code, s.code, 'CODE') as subject_code, u.full_name as uploader_name
      FROM materials m
      LEFT JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      // Students see non-private materials for enrolled subjects OR materials uploaded by themselves
      query += ` AND ((m.is_private = 0 AND (m.subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = ?) OR m.subject_id IN (SELECT id FROM subjects WHERE department = ?))) OR m.uploaded_by = ?)`
      args.push(user.id, user.student?.department || user.department || 'CSE', user.id)
    } else if (user.role === 'teacher') {
      query += ` AND (s.teacher_id = ? OR m.uploaded_by = ? OR m.subject_id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?))`
      args.push(user.id, user.id, user.id)
    }

    if (reqSubjectId) {
      query += ` AND m.subject_id = ?`
      args.push(reqSubjectId)
    }

    query += ` ORDER BY m.created_at DESC`

    const result = await db.execute({ sql: query, args })

    const materials = result.rows.map((row: any) => ({
      id: String(row.id),
      subject_id: String(row.subject_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      file_url: row.file_url ? String(row.file_url) : null,
      type: (row.type as 'notes' | 'slides' | 'video' | 'link' | 'document') || 'notes',
      is_private: Boolean(row.is_private),
      uploaded_by: String(row.uploaded_by),
      created_at: String(row.created_at),
      subject: {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      },
      uploader: {
        id: String(row.uploaded_by),
        full_name: row.uploader_name ? String(row.uploader_name) : 'Faculty',
      }
    }))

    return NextResponse.json(materials)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { subject_id, title, description, file_url, type, is_private } = body

    if (!subject_id || !title) {
      return NextResponse.json({ error: 'Subject and title are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `mat-${Date.now()}`
    const createdAt = new Date().toISOString()
    const privateFlag = is_private !== undefined ? (is_private ? 1 : 0) : 0

    await db.execute({
      sql: `INSERT INTO materials (id, subject_id, title, description, file_url, type, is_private, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, subject_id, title, description || null,
        file_url || null, type || 'notes', privateFlag, user.id, createdAt
      ],
    })

    return NextResponse.json({
      id,
      subject_id,
      title,
      description: description || null,
      file_url: file_url || null,
      type: type || 'notes',
      is_private: Boolean(privateFlag),
      uploaded_by: user.id,
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to upload material' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const db = getDb()
    if (user.role === 'admin') {
      await db.execute({ sql: 'DELETE FROM materials WHERE id = ?', args: [id] })
    } else {
      await db.execute({ sql: 'DELETE FROM materials WHERE id = ? AND uploaded_by = ?', args: [id, user.id] })
    }

    return NextResponse.json({ success: true, message: 'Material deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete material' }, { status: 500 })
  }
}
