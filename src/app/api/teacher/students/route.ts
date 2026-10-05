import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireRole } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ['teacher', 'admin'])
    const db = getDb()
    const url = new URL(req.url)
    const filterSubjectId = url.searchParams.get('subject_id')
    const filterSection = url.searchParams.get('section')
    const search = url.searchParams.get('search')?.toLowerCase()

    // 1. Fetch classes assigned to this teacher
    let assignedClassesQuery = `
      SELECT 
        ts.id as class_id, ts.teacher_id, ts.subject_id, ts.department, ts.year, ts.semester, ts.section,
        s.subject_code, s.subject_name, s.credits
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
    `
    const assignedArgs: any[] = []
    if (user.role === 'teacher') {
      assignedClassesQuery += ` WHERE ts.teacher_id = ?`
      assignedArgs.push(user.id)
    }
    assignedClassesQuery += ` ORDER BY s.subject_name ASC, ts.section ASC`

    const assignedClassesResult = await db.execute({ sql: assignedClassesQuery, args: assignedArgs })
    const assignedClasses = assignedClassesResult.rows.map((row: any) => ({
      class_id: String(row.class_id),
      teacher_id: String(row.teacher_id),
      subject_id: String(row.subject_id),
      subject_code: String(row.subject_code),
      subject_name: String(row.subject_name),
      credits: Number(row.credits || 3),
      department: String(row.department),
      year: String(row.year),
      semester: Number(row.semester),
      section: String(row.section),
    }))

    if (assignedClasses.length === 0 && user.role === 'teacher') {
      return NextResponse.json({
        assigned_classes: [],
        students: [],
        message: 'No courses or sections are currently assigned to your teacher account. Contact your administrator or allocate a class.',
      })
    }

    // 2. Determine target subjects & sections
    const targetSubjectIds = filterSubjectId 
      ? [filterSubjectId] 
      : Array.from(new Set(assignedClasses.map((c) => c.subject_id)))

    // 3. Query students enrolled in or belonging to these assigned courses & sections
    let studentsQuery = `
      SELECT DISTINCT
        u.id as user_id, u.full_name, u.email,
        st.id as student_record_id, st.register_number, st.department, st.year, st.semester, st.section, st.phone, st.status
      FROM users u
      LEFT JOIN students st ON u.id = st.user_id
      WHERE u.role = 'student'
      AND (
        u.id IN (
          SELECT e.student_id FROM enrollments e WHERE e.subject_id IN (${targetSubjectIds.map(() => '?').join(',') || "''"})
        )
        OR (
          st.department IN (${assignedClasses.map(() => '?').join(',') || "''"})
          AND st.section IN (${assignedClasses.map(() => '?').join(',') || "''"})
        )
      )
    `
    const studentArgs: any[] = [
      ...targetSubjectIds,
      ...assignedClasses.map((c) => c.department),
      ...assignedClasses.map((c) => c.section),
    ]

    if (filterSection && filterSection !== 'all') {
      studentsQuery += ` AND st.section = ?`
      studentArgs.push(filterSection)
    }

    studentsQuery += ` ORDER BY u.full_name ASC`
    const studentsResult = await db.execute({ sql: studentsQuery, args: studentArgs })

    // 4. For each student, compute course-specific attendance, grades, assignment status, and teacher remarks
    const studentRecords = []

    for (const s of studentsResult.rows) {
      const studentId = String(s.user_id)
      const studentName = String(s.full_name)
      const studentEmail = String(s.email)
      const regNum = s.register_number ? String(s.register_number) : `REG-${studentId.slice(-4).toUpperCase()}`

      if (search && !studentName.toLowerCase().includes(search) && !studentEmail.toLowerCase().includes(search) && !regNum.toLowerCase().includes(search)) {
        continue
      }

      // Compute details for each assigned course/class
      for (const cls of assignedClasses) {
        if (filterSubjectId && cls.subject_id !== filterSubjectId) continue
        if (filterSection && filterSection !== 'all' && cls.section !== filterSection) continue

        // Check if student belongs to this course (via enrollment OR department/section match)
        const isEnrolled = await db.execute({
          sql: `SELECT 1 FROM enrollments WHERE student_id = ? AND subject_id = ? LIMIT 1`,
          args: [studentId, cls.subject_id],
        })
        const matchesSection = s.department === cls.department && s.section === cls.section

        if (isEnrolled.rows.length === 0 && !matchesSection) {
          continue
        }

        // Attendance stats in this course
        const attStats = await db.execute({
          sql: `SELECT 
                  COUNT(*) as total_recorded,
                  SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                  SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                  MAX(date) as last_date
                FROM attendance
                WHERE student_id = ? AND subject_id = ?`,
          args: [studentId, cls.subject_id],
        })
        const totalAtt = Number(attStats.rows[0]?.total_recorded || 0)
        const presentAtt = Number(attStats.rows[0]?.present_count || 0)
        const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100

        // Submissions stats in this course
        const assignStats = await db.execute({
          sql: `SELECT 
                  (SELECT COUNT(*) FROM assignments WHERE subject_id = ?) as total_assignments,
                  (SELECT COUNT(*) FROM submissions sub 
                   JOIN assignments a ON sub.assignment_id = a.id 
                   WHERE a.subject_id = ? AND sub.student_id = ?) as submitted_assignments`,
          args: [cls.subject_id, cls.subject_id, studentId],
        })
        const totalAssign = Number(assignStats.rows[0]?.total_assignments || 0)
        const subAssign = Number(assignStats.rows[0]?.submitted_assignments || 0)

        // Teacher records & grades
        const recResult = await db.execute({
          sql: `SELECT internal_marks, max_marks, grade_letter, remarks, updated_at 
                FROM teacher_student_records 
                WHERE student_id = ? AND subject_id = ? AND teacher_id = ?
                LIMIT 1`,
          args: [studentId, cls.subject_id, user.id],
        })

        let internalMarks: number | null = null
        let maxMarks = 100
        let gradeLetter: string | null = null
        let remarks: string = ''
        let lastUpdated: string | null = null

        if (recResult.rows.length > 0) {
          internalMarks = recResult.rows[0].internal_marks !== null ? Number(recResult.rows[0].internal_marks) : null
          maxMarks = Number(recResult.rows[0].max_marks || 100)
          gradeLetter = recResult.rows[0].grade_letter ? String(recResult.rows[0].grade_letter) : null
          remarks = recResult.rows[0].remarks ? String(recResult.rows[0].remarks) : ''
          lastUpdated = recResult.rows[0].updated_at ? String(recResult.rows[0].updated_at) : null
        } else {
          // Check standard grades table
          const gradeFallback = await db.execute({
            sql: `SELECT marks, max_marks, grade FROM grades WHERE student_id = ? AND subject_id = ? LIMIT 1`,
            args: [studentId, cls.subject_id],
          })
          if (gradeFallback.rows.length > 0) {
            internalMarks = Number(gradeFallback.rows[0].marks)
            maxMarks = Number(gradeFallback.rows[0].max_marks || 100)
            gradeLetter = String(gradeFallback.rows[0].grade)
          }
        }

        studentRecords.push({
          id: `${studentId}-${cls.subject_id}`,
          student_id: studentId,
          full_name: studentName,
          email: studentEmail,
          register_number: regNum,
          department: s.department || cls.department,
          year: s.year || cls.year,
          semester: s.semester || cls.semester,
          section: s.section || cls.section,
          phone: s.phone ? String(s.phone) : null,
          status: s.status || 'active',
          // Course context
          class_id: cls.class_id,
          subject_id: cls.subject_id,
          subject_code: cls.subject_code,
          subject_name: cls.subject_name,
          course_credits: cls.credits,
          // Performance indicators
          attendance_percentage: attRate,
          attended_classes: presentAtt,
          total_classes: totalAtt,
          last_attendance: attStats.rows[0]?.last_date || null,
          total_assignments: totalAssign,
          submitted_assignments: subAssign,
          pending_assignments: Math.max(0, totalAssign - subAssign),
          // Editable teacher evaluation
          internal_marks: internalMarks,
          max_marks: maxMarks,
          grade_letter: gradeLetter,
          remarks: remarks,
          last_updated: lastUpdated,
        })
      }
    }

    return NextResponse.json({
      assigned_classes: assignedClasses,
      students: studentRecords,
      total_students: studentRecords.length,
    })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to fetch student records' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(req, ['teacher', 'admin'])
    const db = getDb()
    const body = await req.json()
    const { student_id, subject_id, section, internal_marks, max_marks = 100, grade_letter, remarks } = body

    if (!student_id || !subject_id) {
      return NextResponse.json({ error: 'Student ID and Subject ID are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const recordId = `tsrec-${user.id}-${student_id}-${subject_id}`

    // 1. Upsert teacher_student_records
    await db.execute({
      sql: `INSERT INTO teacher_student_records 
              (id, teacher_id, student_id, subject_id, section, internal_marks, max_marks, grade_letter, remarks, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              internal_marks = excluded.internal_marks,
              max_marks = excluded.max_marks,
              grade_letter = excluded.grade_letter,
              remarks = excluded.remarks,
              section = excluded.section,
              updated_at = excluded.updated_at`,
      args: [
        recordId,
        user.id,
        student_id,
        subject_id,
        section || 'A',
        internal_marks !== undefined && internal_marks !== null ? Number(internal_marks) : null,
        Number(max_marks || 100),
        grade_letter || null,
        remarks || '',
        now,
        now,
      ],
    })

    // 2. Synchronize into central grades table so student sees updated report card immediately
    if (internal_marks !== undefined && internal_marks !== null) {
      const gradeId = `grd-${student_id}-${subject_id}`
      await db.execute({
        sql: `INSERT INTO grades (id, student_id, subject_id, exam_id, marks, max_marks, grade, semester, created_at)
              VALUES (?, ?, ?, null, ?, ?, ?, 1, ?)
              ON CONFLICT(id) DO UPDATE SET
                marks = excluded.marks,
                max_marks = excluded.max_marks,
                grade = excluded.grade`,
        args: [
          gradeId,
          student_id,
          subject_id,
          Number(internal_marks),
          Number(max_marks || 100),
          grade_letter || (Number(internal_marks) >= 90 ? 'A+' : Number(internal_marks) >= 80 ? 'A' : Number(internal_marks) >= 70 ? 'B+' : Number(internal_marks) >= 60 ? 'B' : 'C'),
          now,
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Student course record updated successfully',
      record_id: recordId,
      updated_at: now,
    })
  } catch (err: any) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: err.message || 'Failed to update student course record' }, { status: 500 })
  }
}
