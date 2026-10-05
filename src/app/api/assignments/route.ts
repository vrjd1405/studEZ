import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth, requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const db = getDb()
    const url = new URL(req.url)
    const reqSubjectId = url.searchParams.get('subject_id')

    let query = `
      SELECT 
        a.id, a.title, a.description, a.subject_id, a.teacher_id,
        a.department, a.year, a.semester, a.section, a.due_date, a.attachment_url, a.max_marks,
        a.created_at, a.updated_at,
        s.subject_code, s.subject_name,
        u.full_name as teacher_name
      FROM assignments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN users u ON a.teacher_id = u.id
      WHERE 1=1
    `
    const args: any[] = []

    if (user.role === 'student') {
      if (user.student) {
        query += ` AND (a.department = 'all' OR a.department = ?)
                   AND (a.year = 'all' OR a.year = ?)
                   AND (a.section = 'all' OR a.section = ?)`
        args.push(user.student.department, user.student.year, user.student.section)
      } else {
        query += ` AND a.department = ?`
        args.push(user.department || 'CSE')
      }
    } else if (user.role === 'teacher') {
      query += ` AND (a.teacher_id = ? OR a.department = ?)`
      args.push(user.id, user.department || 'CSE')
    }

    if (reqSubjectId) {
      query += ` AND a.subject_id = ?`
      args.push(reqSubjectId)
    }

    query += ` ORDER BY a.due_date ASC`
    const result = await db.execute({ sql: query, args })

    // For each assignment, also check submission count or student's own submission status
    const assignments = await Promise.all(
      result.rows.map(async (row: any) => {
        let submissionStatus: any = null
        if (user.role === 'student') {
          const subRes = await db.execute({
            sql: 'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
            args: [String(row.id), user.id],
          })
          if (subRes.rows.length > 0) {
            submissionStatus = subRes.rows[0]
          }
        }

        return {
          id: String(row.id),
          subject_id: String(row.subject_id),
          title: String(row.title),
          description: row.description ? String(row.description) : null,
          department: String(row.department),
          year: String(row.year),
          semester: Number(row.semester),
          section: String(row.section),
          due_date: String(row.due_date),
          attachment_url: row.attachment_url ? String(row.attachment_url) : null,
          max_marks: Number(row.max_marks || 100),
          teacher_id: String(row.teacher_id),
          created_at: String(row.created_at),
          updated_at: String(row.updated_at),
          subject: {
            id: String(row.subject_id),
            name: row.subject_name ? String(row.subject_name) : 'Subject',
            code: row.subject_code ? String(row.subject_code) : 'CODE',
          },
          teacher: {
            id: String(row.teacher_id),
            full_name: row.teacher_name ? String(row.teacher_name) : 'Instructor',
          },
          my_submission: submissionStatus ? {
            id: String(submissionStatus.id),
            submitted_at: String(submissionStatus.submitted_at),
            status: String(submissionStatus.status),
            marks: submissionStatus.marks !== null ? Number(submissionStatus.marks) : null,
            feedback: submissionStatus.feedback ? String(submissionStatus.feedback) : null,
            file_url: submissionStatus.file_url ? String(submissionStatus.file_url) : null,
          } : null,
        }
      })
    )

    return NextResponse.json(assignments)
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const body = await req.json()
    const {
      subject_id,
      title,
      description,
      due_date,
      max_marks,
      department,
      year,
      semester,
      section,
      attachment_url,
    } = body

    if (!subject_id || !title || !due_date) {
      return NextResponse.json({ error: 'Subject, title, and due date are required' }, { status: 400 })
    }

    const db = getDb()
    const id = `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()
    const finalDept = (department || user.department || 'CSE').trim()
    const finalYear = year || '1st Year'
    const finalSem = semester ? Number(semester) : 1
    const finalSec = (section || 'A').trim().toUpperCase()

    await db.execute({
      sql: `INSERT INTO assignments (id, title, description, subject_id, teacher_id, department, year, semester, section, due_date, attachment_url, max_marks, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title.trim(),
        description || null,
        subject_id,
        user.id,
        finalDept,
        finalYear,
        finalSem,
        finalSec,
        due_date,
        attachment_url || null,
        Number(max_marks) || 100,
        now,
        now,
      ],
    })

    return NextResponse.json({
      id,
      title,
      subject_id,
      department: finalDept,
      year: finalYear,
      section: finalSec,
      due_date,
      max_marks: Number(max_marks) || 100,
      created_at: now,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to create assignment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, ['admin', 'teacher'])
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const db = getDb()
    if (user.role === 'admin') {
      await db.execute({ sql: 'DELETE FROM assignments WHERE id = ?', args: [id] })
    } else {
      await db.execute({ sql: 'DELETE FROM assignments WHERE id = ? AND teacher_id = ?', args: [id, user.id] })
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted' })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to delete assignment' }, { status: 500 })
  }
}
