import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const reqStudentId = url.searchParams.get('student_id')
    const reqSubjectId = url.searchParams.get('subject_id')

    // TEST 9 SECURITY ENFORCEMENT:
    // If student attempts to query another student's private data -> strictly reject with 403 Forbidden!
    if (user.role === 'student' && reqStudentId && reqStudentId !== user.id) {
      return NextResponse.json({
        error: 'Forbidden: Students cannot access another student\'s private academic records.'
      }, { status: 403 })
    }

    let query = `
      SELECT g.*, COALESCE(s.subject_name, s.name, 'Subject') as subject_name, COALESCE(s.subject_code, s.code, 'CODE') as subject_code, e.title as exam_title, u.full_name as student_name
      FROM grades g
      LEFT JOIN subjects s ON g.subject_id = s.id
      LEFT JOIN exams e ON g.exam_id = e.id
      LEFT JOIN users u ON g.student_id = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      // Students can ONLY ever see their own grades
      query += ` AND g.student_id = ?`
      args.push(user.id)
    } else if (user.role === 'teacher') {
      // Teachers can view grades for their subjects
      query += ` AND (s.teacher_id = ? OR g.subject_id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?))`
      args.push(user.id, user.id)

      if (reqStudentId) {
        query += ` AND g.student_id = ?`
        args.push(reqStudentId)
      }
    } else {
      if (reqStudentId) {
        query += ` AND g.student_id = ?`
        args.push(reqStudentId)
      }
    }

    if (reqSubjectId) {
      query += ` AND g.subject_id = ?`
      args.push(reqSubjectId)
    }

    query += ` ORDER BY g.created_at DESC`

    const result = await db.execute({ sql: query, args })

    const grades = result.rows.map((row: any) => ({
      id: String(row.id),
      student_id: String(row.student_id),
      subject_id: String(row.subject_id),
      exam_id: row.exam_id ? String(row.exam_id) : null,
      marks: Number(row.marks),
      max_marks: Number(row.max_marks),
      grade: row.grade ? String(row.grade) : null,
      semester: Number(row.semester || 1),
      created_at: String(row.created_at),
      subject: {
        id: String(row.subject_id),
        name: String(row.subject_name),
        code: String(row.subject_code),
      },
      exam: row.exam_title ? {
        id: String(row.exam_id),
        title: String(row.exam_title),
      } : undefined,
      student: {
        id: String(row.student_id),
        full_name: row.student_name ? String(row.student_name) : 'Student',
      }
    }))

    return NextResponse.json(grades)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch grades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // TEST 8 SECURITY ENFORCEMENT:
    // Students can NEVER modify or create grades!
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const { student_id, subject_id, exam_id, marks, max_marks, grade, semester } = body

    if (!student_id || !subject_id || marks === undefined || max_marks === undefined) {
      return NextResponse.json({ error: 'Missing required grade information' }, { status: 400 })
    }

    const db = getDb()

    // If teacher: verify subject authorization
    if (user.role === 'teacher') {
      const subCheck = await db.execute({
        sql: 'SELECT id FROM subjects WHERE id = ? AND (teacher_id = ? OR id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?))',
        args: [subject_id, user.id, user.id],
      })
      if (subCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Forbidden: You do not teach this subject' }, { status: 403 })
      }
    }

    const id = `grd-${Date.now()}`
    const createdAt = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO grades (id, student_id, subject_id, exam_id, marks, max_marks, grade, semester, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, student_id, subject_id, exam_id || null,
        Number(marks), Number(max_marks), grade || null, Number(semester) || 1, createdAt
      ],
    })

    return NextResponse.json({
      id,
      student_id,
      subject_id,
      exam_id: exam_id || null,
      marks: Number(marks),
      max_marks: Number(max_marks),
      grade: grade || null,
      semester: Number(semester) || 1,
      created_at: createdAt,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to record grade' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Grade ID is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM grades WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true, message: 'Grade record deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete grade' }, { status: 500 })
  }
}
