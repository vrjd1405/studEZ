import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const department = url.searchParams.get('department')
    const year = url.searchParams.get('year')
    const semester = url.searchParams.get('semester')

    let query = `SELECT * FROM subjects WHERE 1=1`
    const args: any[] = []

    if (department && department !== 'all') {
      query += ` AND department = ?`
      args.push(department)
    }

    if (year && year !== 'all') {
      query += ` AND year = ?`
      args.push(year)
    }

    if (semester && semester !== 'all') {
      query += ` AND semester = ?`
      args.push(Number(semester))
    }

    query += ` ORDER BY subject_code ASC`
    const result = await db.execute({ sql: query, args })

    const subjects = result.rows.map((row: any) => ({
      id: String(row.id),
      code: String(row.subject_code),
      subject_code: String(row.subject_code),
      name: String(row.subject_name),
      subject_name: String(row.subject_name),
      department: String(row.department),
      year: String(row.year),
      semester: Number(row.semester),
      credits: Number(row.credits || 3),
      created_at: String(row.created_at),
    }))

    return NextResponse.json(subjects)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const { subject_code, subject_name, code, name, department, year, semester, credits } = body

    const finalCode = (subject_code || code || '').trim().toUpperCase()
    const finalName = (subject_name || name || '').trim()
    const finalDept = (department || 'CSE').trim()
    const finalYear = year || '1st Year'
    const finalSem = semester ? Number(semester) : 1
    const finalCredits = credits ? Number(credits) : 3

    if (!finalCode || !finalName) {
      return NextResponse.json({ error: 'Subject code and subject name are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `subj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO subjects (id, subject_code, subject_name, department, year, semester, credits, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, finalCode, finalName, finalDept, finalYear, finalSem, finalCredits, now],
    })

    return NextResponse.json({
      id,
      code: finalCode,
      subject_code: finalCode,
      name: finalName,
      subject_name: finalName,
      department: finalDept,
      year: finalYear,
      semester: finalSem,
      credits: finalCredits,
      created_at: now,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create subject' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM subjects WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Subject deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete subject' }, { status: 500 })
  }
}
