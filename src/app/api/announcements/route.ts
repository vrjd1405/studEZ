import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    let query = `
      SELECT 
        a.*, u.full_name as author_name, u.role as author_role
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      if (user.student) {
        query += ` AND (a.target_role = 'all' OR a.target_role = 'student')
                   AND (a.department = 'all' OR a.department = ?)
                   AND (a.year = 'all' OR a.year = ?)
                   AND (a.section = 'all' OR a.section = ?)`
        args.push(user.student.department, user.student.year, user.student.section)
      } else {
        query += ` AND (a.target_role = 'all' OR a.target_role = 'student')`
      }
    } else if (user.role === 'teacher') {
      query += ` AND (a.target_role = 'all' OR a.target_role = 'teacher' OR a.created_by = ?)`
      args.push(user.id)
    }

    query += ` ORDER BY a.created_at DESC`
    const result = await db.execute({ sql: query, args })

    return NextResponse.json(result.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const { title, content, target_role, department, year, section } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO announcements (id, title, content, created_by, target_role, department, year, section, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title.trim(),
        content.trim(),
        user.id,
        target_role || 'all',
        department || 'all',
        year || 'all',
        section || 'all',
        now,
        now,
      ],
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to post announcement' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM announcements WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true, message: 'Announcement deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete announcement' }, { status: 500 })
  }
}
