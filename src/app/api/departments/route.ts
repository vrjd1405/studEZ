import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const result = await db.execute('SELECT * FROM departments ORDER BY department_code ASC')
    return NextResponse.json(result.rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const { department_code, department_name } = body

    if (!department_code || !department_name) {
      return NextResponse.json({ error: 'Department code and name are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `dept-${Date.now()}`
    const now = new Date().toISOString()

    await db.execute({
      sql: 'INSERT INTO departments (id, department_code, department_name, created_at) VALUES (?, ?, ?, ?)',
      args: [id, department_code.trim().toUpperCase(), department_name.trim(), now],
    })

    return NextResponse.json({
      id,
      department_code: department_code.trim().toUpperCase(),
      department_name: department_name.trim(),
      created_at: now,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create department' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM departments WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Department deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete department' }, { status: 500 })
  }
}
