import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const reqAssignmentId = url.searchParams.get('assignment_id')
    const reqStudentId = url.searchParams.get('student_id')

    let query = `
      SELECT 
        sub.id, sub.assignment_id, sub.student_id, sub.file_url, sub.content,
        sub.submitted_at, sub.status, sub.marks, sub.feedback,
        a.title as assignment_title, a.max_marks as assignment_max, a.due_date,
        u.full_name as student_name, u.email as student_email,
        stu.register_number, stu.department, stu.section
      FROM submissions sub
      JOIN assignments a ON sub.assignment_id = a.id
      JOIN users u ON sub.student_id = u.id
      LEFT JOIN students stu ON u.id = stu.user_id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      query += ` AND sub.student_id = ?`
      args.push(user.id)
    } else if (user.role === 'teacher') {
      query += ` AND a.teacher_id = ?`
      args.push(user.id)

      if (reqStudentId) {
        query += ` AND sub.student_id = ?`
        args.push(reqStudentId)
      }
    } else {
      if (reqStudentId) {
        query += ` AND sub.student_id = ?`
        args.push(reqStudentId)
      }
    }

    if (reqAssignmentId) {
      query += ` AND sub.assignment_id = ?`
      args.push(reqAssignmentId)
    }

    query += ` ORDER BY sub.submitted_at DESC`
    const result = await db.execute({ sql: query, args })
    return NextResponse.json(result.rows)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch submissions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['student'])
    const body = await req.json()
    const { assignment_id, content, file_url } = body

    if (!assignment_id) {
      return NextResponse.json({ error: 'assignment_id is required' }, { status: 400 })
    }

    const db = getDb()
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const submittedAt = new Date().toISOString()
    const finalUrl = file_url || `/uploads/submissions/${id}.pdf`

    await db.execute({
      sql: `INSERT INTO submissions (id, assignment_id, student_id, file_url, content, submitted_at, status)
            VALUES (?, ?, ?, ?, ?, ?, 'submitted')
            ON CONFLICT(assignment_id, student_id) 
            DO UPDATE SET content = excluded.content, file_url = excluded.file_url, submitted_at = excluded.submitted_at, status = 'submitted'`,
      args: [id, assignment_id, user.id, finalUrl, content || 'Attached submission solution', submittedAt],
    })

    return NextResponse.json({ success: true, id, assignment_id, student_id: user.id, file_url: finalUrl }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  return handleGrade(req)
}

export async function PUT(req: NextRequest) {
  return handleGrade(req)
}

async function handleGrade(req: NextRequest) {
  try {
    // Only TEACHER or ADMIN can grade submissions
    const user = await requireRole(req, ['teacher', 'admin'])
    const body = await req.json()
    const { id, marks, feedback } = body

    if (!id || marks === undefined) {
      return NextResponse.json({ error: 'id and marks are required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `UPDATE submissions 
            SET marks = ?, feedback = ?, status = 'graded'
            WHERE id = ?`,
      args: [Number(marks), feedback || null, id],
    })

    return NextResponse.json({ success: true, id, marks: Number(marks), feedback, status: 'graded' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to grade submission' }, { status: 500 })
  }
}
