import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const teacherIdFilter = url.searchParams.get('teacher_id')

    let query = `
      SELECT 
        ts.id, ts.teacher_id, ts.subject_id, ts.department, ts.year, ts.semester, ts.section, ts.created_at,
        s.subject_code, s.subject_name, s.credits,
        u.full_name as teacher_name, u.email as teacher_email
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      JOIN users u ON ts.teacher_id = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'teacher') {
      query += ` AND ts.teacher_id = ?`
      args.push(user.id)
    } else if (user.role === 'student') {
      if (user.student) {
        query += ` AND ts.department = ? AND ts.year = ? AND ts.section = ?`
        args.push(user.student.department, user.student.year, user.student.section)
      }
    } else if (teacherIdFilter) {
      query += ` AND ts.teacher_id = ?`
      args.push(teacherIdFilter)
    }

    query += ` ORDER BY ts.department ASC, ts.year ASC, ts.section ASC, s.subject_name ASC`
    const result = await db.execute({ sql: query, args })

    return NextResponse.json(result.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch assigned classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const body = await req.json()
    const { teacher_id, subject_id, department, year, semester, section } = body

    if (!teacher_id || !subject_id || !department || !year || !section) {
      return NextResponse.json(
        { error: 'Teacher, Subject, Department, Year, and Section are required to allocate a class' },
        { status: 400 }
      )
    }

    const db = getDb()
    const id = `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const sem = semester ? Number(semester) : 1

    // Insert into teacher_subjects
    await db.execute({
      sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, teacher_id, subject_id, department.trim(), year, sem, section.trim().toUpperCase(), now],
    })

    // Also update/insert into courses for consistency
    const courseId = `crs-${Date.now()}`
    const subjRes = await db.execute({
      sql: 'SELECT subject_code, subject_name, credits FROM subjects WHERE id = ? LIMIT 1',
      args: [subject_id],
    })
    const subInfo = subjRes.rows[0]
    if (subInfo) {
      await db.execute({
        sql: `INSERT INTO courses (id, course_code, course_name, department, year, semester, section, credits, teacher_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          courseId,
          String(subInfo.subject_code),
          String(subInfo.subject_name),
          department.trim(),
          year,
          sem,
          section.trim().toUpperCase(),
          Number(subInfo.credits || 3),
          teacher_id,
          now,
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Class assigned successfully',
      id,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to assign class' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireRole(req, ['admin'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Class assignment ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM teacher_subjects WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Class assignment removed' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to remove class assignment' }, { status: 500 })
  }
}
