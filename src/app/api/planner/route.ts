import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    const query = `
      SELECT t.*, s.name as subject_name, s.code as subject_code
      FROM study_tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.student_id = ?
      ORDER BY t.completed ASC, t.due_date ASC, t.created_at DESC
    `
    const result = await db.execute({
      sql: query,
      args: [user.id],
    })

    const tasks = result.rows.map((row: any) => ({
      id: String(row.id),
      student_id: String(row.student_id),
      subject_id: row.subject_id ? String(row.subject_id) : null,
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      priority: String(row.priority || 'medium') as 'low' | 'medium' | 'high',
      due_date: row.due_date ? String(row.due_date) : null,
      duration_minutes: Number(row.duration_minutes || 60),
      completed: Boolean(row.completed),
      created_at: String(row.created_at),
      subject: row.subject_name ? {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      } : undefined,
    }))

    return NextResponse.json(tasks)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch study tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { title, description, subject_id, priority, due_date, duration_minutes } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    const db = getDb()

    // Validate subject if provided
    let verifiedSubjectId: string | null = null
    if (subject_id) {
      const subCheck = await db.execute({
        sql: `SELECT s.id FROM subjects s 
              WHERE s.id = ? OR LOWER(s.code) = LOWER(?) OR LOWER(s.name) LIKE LOWER(?)`,
        args: [subject_id, subject_id, `%${subject_id}%`],
      })
      if (subCheck.rows.length > 0) {
        verifiedSubjectId = String(subCheck.rows[0].id)
      }
    }

    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO study_tasks (id, student_id, subject_id, title, description, priority, due_date, duration_minutes, completed, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [
        id,
        user.id,
        verifiedSubjectId,
        title.trim(),
        description || null,
        priority && ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        due_date || null,
        Number(duration_minutes) || 60,
        createdAt,
      ],
    })

    return NextResponse.json({
      id,
      student_id: user.id,
      subject_id: verifiedSubjectId,
      title: title.trim(),
      description: description || null,
      priority: priority || 'medium',
      due_date: due_date || null,
      duration_minutes: Number(duration_minutes) || 60,
      completed: false,
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create task' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { id, completed, title, priority, due_date } = body

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 })
    }

    const db = getDb()
    const updates: string[] = []
    const args: any[] = []

    if (completed !== undefined) {
      updates.push('completed = ?')
      args.push(completed ? 1 : 0)
    }
    if (title !== undefined) {
      updates.push('title = ?')
      args.push(title)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      args.push(priority)
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?')
      args.push(due_date)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    args.push(id, user.id)
    await db.execute({
      sql: `UPDATE study_tasks SET ${updates.join(', ')} WHERE id = ? AND student_id = ?`,
      args,
    })

    return NextResponse.json({ success: true, id, completed })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM study_tasks WHERE id = ? AND student_id = ?',
      args: [id, user.id],
    })

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete task' }, { status: 500 })
  }
}
