import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    // Students only access their own private documents or shared documents for their subjects
    let query = `
      SELECT d.*, s.name as subject_name, s.code as subject_code
      FROM documents d
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      query += ` AND (d.user_id = ? OR (d.is_private = 0 AND d.subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = ?)))`
      args.push(user.id, user.id)
    } else if (user.role === 'teacher') {
      query += ` AND (d.user_id = ? OR d.subject_id IN (SELECT id FROM subjects WHERE teacher_id = ?))`
      args.push(user.id, user.id)
    }

    query += ` ORDER BY d.created_at DESC`

    const result = await db.execute({ sql: query, args })

    const documents = result.rows.map((row: any) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      subject_id: row.subject_id ? String(row.subject_id) : null,
      title: String(row.title),
      file_name: String(row.file_name),
      file_type: String(row.file_type),
      content: String(row.content),
      is_private: Boolean(row.is_private),
      created_at: String(row.created_at),
      subject: row.subject_name ? {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      } : undefined,
    }))

    return NextResponse.json(documents)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { title, file_name, file_type, content, subject_id, is_private } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Document title and content are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `doc-${Date.now()}`
    const createdAt = new Date().toISOString()
    const privateFlag = is_private !== undefined ? (is_private ? 1 : 0) : 1

    await db.execute({
      sql: `INSERT INTO documents (id, user_id, subject_id, title, file_name, file_type, content, is_private, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        user.id,
        subject_id || null,
        title,
        file_name || 'document.txt',
        file_type || 'text/plain',
        content,
        privateFlag,
        createdAt,
      ],
    })

    return NextResponse.json({
      id,
      user_id: user.id,
      subject_id: subject_id || null,
      title,
      file_name: file_name || 'document.txt',
      file_type: file_type || 'text/plain',
      is_private: Boolean(privateFlag),
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to store document' }, { status: 500 })
  }
}
