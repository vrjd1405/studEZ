import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()

    const query = `
      SELECT n.*, u.full_name as creator_name
      FROM notifications n
      JOIN users u ON n.created_by = u.id
      WHERE n.target_role = 'all' OR n.target_role = ? OR n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `
    const result = await db.execute({
      sql: query,
      args: [user.role, user.id],
    })

    const notifications = result.rows.map((row: any) => {
      let readBy: string[] = []
      try {
        readBy = JSON.parse(String(row.read_by || '[]'))
      } catch {
        readBy = []
      }

      return {
        id: String(row.id),
        title: String(row.title),
        message: String(row.message),
        type: String(row.type) as 'info' | 'warning' | 'success' | 'error',
        target_role: String(row.target_role),
        created_by: String(row.created_by),
        read_by: readBy,
        created_at: String(row.created_at),
        creator: {
          id: String(row.created_by),
          full_name: String(row.creator_name),
        }
      }
    })

    return NextResponse.json(notifications)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { id, markAll } = body
    const db = getDb()

    if (markAll) {
      // Mark all visible notifications as read by user
      const visible = await db.execute({
        sql: `SELECT id, read_by FROM notifications WHERE target_role = 'all' OR target_role = ? OR user_id = ?`,
        args: [user.role, user.id],
      })

      for (const row of visible.rows) {
        let readBy: string[] = []
        try { readBy = JSON.parse(String(row.read_by || '[]')) } catch {}
        if (!readBy.includes(user.id)) {
          readBy.push(user.id)
          await db.execute({
            sql: 'UPDATE notifications SET read_by = ? WHERE id = ?',
            args: [JSON.stringify(readBy), String(row.id)],
          })
        }
      }
      return NextResponse.json({ success: true, message: 'All marked as read' })
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 })
    }

    const check = await db.execute({
      sql: 'SELECT id, read_by FROM notifications WHERE id = ?',
      args: [id],
    })

    if (check.rows.length > 0) {
      let readBy: string[] = []
      try { readBy = JSON.parse(String(check.rows[0].read_by || '[]')) } catch {}
      if (!readBy.includes(user.id)) {
        readBy.push(user.id)
        await db.execute({
          sql: 'UPDATE notifications SET read_by = ? WHERE id = ?',
          args: [JSON.stringify(readBy), id],
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to update notification' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const { title, message, type, target_role, user_id } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `notif-${Date.now()}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO notifications (id, title, message, type, target_role, user_id, created_by, read_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?)`,
      args: [id, title, message, type || 'info', target_role || 'all', user_id || null, user.id, createdAt],
    })

    return NextResponse.json({
      id,
      title,
      message,
      type: type || 'info',
      target_role: target_role || 'all',
      created_by: user.id,
      read_by: [],
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create notification' }, { status: 500 })
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
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    const db = getDb()
    if (user.role === 'admin') {
      await db.execute({ sql: 'DELETE FROM notifications WHERE id = ?', args: [id] })
    } else {
      await db.execute({ sql: 'DELETE FROM notifications WHERE id = ? AND created_by = ?', args: [id, user.id] })
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete notification' }, { status: 500 })
  }
}

