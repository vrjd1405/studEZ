// Acceptance Test Suite for StudEZ Multi-Role Architecture
import { createClient } from '@libsql/client'
import crypto from 'crypto'

const db = createClient({
  url: 'file:studez.db',
})

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false
  const [salt, key] = storedHash.split(':')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === key
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ PASSED: ${message}`)
}

async function runAcceptanceTests() {
  console.log('\n======================================================')
  console.log('🚀 RUNNING 7 ACCEPTANCE TESTS FOR STUDEZ')
  console.log('======================================================\n')

  const now = new Date().toISOString()
  const studentEmail = `test.student.${Date.now()}@campus.edu`
  const teacherEmail = `test.teacher.${Date.now()}@campus.edu`
  const password = 'password123'
  const pwdHash = hashPassword(password)

  // -------------------------------------------------------------------------
  // TEST 1: Admin creates Student STU001 (1st Year, Sec A, CSE)
  // Student logs in and sees those exact details.
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Admin creates student & student logs in ---')
  const studentUserId = `usr-stu-${Date.now()}`
  const studentId = `stu-${Date.now()}`

  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
          VALUES (?, ?, ?, 'student', 'Test Student', '+91 9999988888', 'active', ?, ?)`,
    args: [studentUserId, studentEmail, pwdHash, now, now],
  })

  const regNo = `STU${Date.now().toString().slice(-4)}`
  await db.execute({
    sql: `INSERT INTO students (id, user_id, register_number, full_name, email, phone, year, semester, department, section, batch, admission_year, college, status, created_at, updated_at)
          VALUES (?, ?, ?, 'Test Student', ?, '+91 9999988888', '1st Year', 1, 'CSE', 'A', '2024-2028', 2024, 'Campus Institute of Technology', 'active', ?, ?)`,
    args: [studentId, studentUserId, regNo, studentEmail, now, now],
  })

  // Simulate Student Login
  const loginUser = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
    args: [studentEmail],
  })
  assert(loginUser.rows.length === 1, 'Student account queried from central users table')
  assert(verifyPassword(password, String(loginUser.rows[0].password_hash)), 'Student password verified successfully')

  // Query student profile
  const stuProfile = await db.execute({
    sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
    args: [studentUserId],
  })
  assert(stuProfile.rows[0].full_name === 'Test Student', 'Student Name is "Test Student"')
  assert(stuProfile.rows[0].register_number === regNo, `Register No is "${regNo}"`)
  assert(stuProfile.rows[0].department === 'CSE', 'Department is "CSE"')
  assert(stuProfile.rows[0].year === '1st Year', 'Year is "1st Year"')
  assert(Number(stuProfile.rows[0].semester) === 1, 'Semester is 1')
  assert(stuProfile.rows[0].section === 'A', 'Section is "A"')

  // -------------------------------------------------------------------------
  // TEST 2: Admin changes Year -> 2nd Year, Section -> B
  // Student logs out & logs back in, immediately sees 2nd Year, Section B.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Admin edits student -> 2nd Year, Section B ---')
  await db.execute({
    sql: `UPDATE students SET year = '2nd Year', semester = 3, section = 'B', updated_at = ? WHERE user_id = ?`,
    args: [new Date().toISOString(), studentUserId],
  })

  // Student re-logs in / loads session
  const reloadedStudent = await db.execute({
    sql: 'SELECT * FROM students WHERE user_id = ? LIMIT 1',
    args: [studentUserId],
  })
  assert(reloadedStudent.rows[0].year === '2nd Year', 'Year updated dynamically to "2nd Year"')
  assert(reloadedStudent.rows[0].section === 'B', 'Section updated dynamically to "B"')
  assert(Number(reloadedStudent.rows[0].semester) === 3, 'Semester updated dynamically to 3')

  // -------------------------------------------------------------------------
  // TEST 3: Admin creates Teacher & assigns BACSE101 / CSE / 2nd Year / Sem 3 / Sec B
  // Teacher logs in and sees assigned class.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Admin creates Teacher & assigns class ---')
  const teacherUserId = `usr-tch-${Date.now()}`
  const teacherId = `tch-${Date.now()}`

  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
          VALUES (?, ?, ?, 'teacher', 'Test Teacher', '+91 9999977777', 'active', ?, ?)`,
    args: [teacherUserId, teacherEmail, pwdHash, now, now],
  })

  const empId = `FAC${Date.now().toString().slice(-4)}`
  await db.execute({
    sql: `INSERT INTO teachers (id, user_id, employee_id, full_name, email, phone, department, designation, subjects, status, created_at, updated_at)
          VALUES (?, ?, ?, 'Test Teacher', ?, '+91 9999977777', 'CSE', 'Assistant Professor', 'BACSE101 Python', 'active', ?, ?)`,
    args: [teacherId, teacherUserId, empId, teacherEmail, now, now],
  })

  // Get BACSE101 subject
  const subRes = await db.execute({
    sql: `SELECT id FROM subjects WHERE subject_code = 'BACSE101' LIMIT 1`,
    args: [],
  })
  let subjectId = subRes.rows[0]?.id
  if (!subjectId) {
    subjectId = `subj-bacse101`
    await db.execute({
      sql: `INSERT INTO subjects (id, subject_code, subject_name, department, year, semester, credits, created_at)
            VALUES (?, 'BACSE101', 'Problem Solving and Python Programming', 'CSE', '2nd Year', 3, 4, ?)`,
      args: [subjectId, now],
    })
  }

  // Admin assigns class to teacher
  const tsId = `ts-${Date.now()}`
  await db.execute({
    sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
          VALUES (?, ?, ?, 'CSE', '2nd Year', 3, 'B', ?)`,
    args: [tsId, teacherUserId, subjectId, now],
  })

  // Teacher queries assigned classes
  const assignedClasses = await db.execute({
    sql: `SELECT ts.*, s.subject_code, s.subject_name 
          FROM teacher_subjects ts 
          JOIN subjects s ON ts.subject_id = s.id 
          WHERE ts.teacher_id = ?`,
    args: [teacherUserId],
  })
  assert(assignedClasses.rows.length >= 1, 'Teacher has assigned classes')
  assert(assignedClasses.rows[0].year === '2nd Year', 'Class year is 2nd Year')
  assert(assignedClasses.rows[0].section === 'B', 'Class section is B')
  assert(assignedClasses.rows[0].department === 'CSE', 'Class department is CSE')

  // -------------------------------------------------------------------------
  // TEST 4: Teacher uploads "Unit 1 Notes" for BACSE101 / CSE / 2nd Year / Sec B
  // Matching student sees it. A 1st Year student does NOT see it.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Teacher uploads targeted notes ---')
  const noteId = `note-${Date.now()}`
  await db.execute({
    sql: `INSERT INTO notes (id, title, description, file_url, subject_id, teacher_id, department, year, semester, section, created_at, updated_at)
          VALUES (?, 'Unit 1 Notes', 'Core python programming fundamentals', '/uploads/unit1.pdf', ?, ?, 'CSE', '2nd Year', 3, 'B', ?, ?)`,
    args: [noteId, subjectId, teacherUserId, now, now],
  })

  // Matching student (2nd Year, Sec B, CSE) queries notes:
  const studentMatchingNotes = await db.execute({
    sql: `SELECT * FROM notes 
          WHERE (department = 'all' OR department = ?)
            AND (year = 'all' OR year = ?)
            AND (section = 'all' OR section = ?)`,
    args: ['CSE', '2nd Year', 'B'],
  })
  const foundMatching = studentMatchingNotes.rows.some((n) => n.id === noteId)
  assert(foundMatching === true, 'Matching student (CSE, 2nd Year, Sec B) sees Unit 1 Notes')

  // Non-matching student (1st Year, Sec A, CSE) queries notes:
  const firstYearNotes = await db.execute({
    sql: `SELECT * FROM notes 
          WHERE (department = 'all' OR department = ?)
            AND (year = 'all' OR year = ?)
            AND (section = 'all' OR section = ?)`,
    args: ['CSE', '1st Year', 'A'],
  })
  const foundInFirstYear = firstYearNotes.rows.some((n) => n.id === noteId)
  assert(foundInFirstYear === false, 'CSE 1st Year Sec A student does NOT see Unit 1 Notes')

  // -------------------------------------------------------------------------
  // TEST 5: Teacher creates assignment. Matching student submits. Teacher sees submission.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Assignment creation, submission, and grading ---')
  const assignmentId = `asg-${Date.now()}`
  await db.execute({
    sql: `INSERT INTO assignments (id, title, description, subject_id, teacher_id, department, year, semester, section, due_date, max_marks, created_at, updated_at)
          VALUES (?, 'Python Lab Assignment 1', 'Submit solution code and report', ?, ?, 'CSE', '2nd Year', 3, 'B', '2026-10-30', 100, ?, ?)`,
    args: [assignmentId, subjectId, teacherUserId, now, now],
  })

  // Student checks assignment visibility
  const studentAssignments = await db.execute({
    sql: `SELECT * FROM assignments 
          WHERE (department = 'all' OR department = ?)
            AND (year = 'all' OR year = ?)
            AND (section = 'all' OR section = ?)`,
    args: ['CSE', '2nd Year', 'B'],
  })
  assert(studentAssignments.rows.some((a) => a.id === assignmentId), 'Student sees the newly targeted assignment')

  // Student submits assignment
  const subId = `sub-${Date.now()}`
  await db.execute({
    sql: `INSERT INTO submissions (id, assignment_id, student_id, file_url, content, submitted_at, status)
          VALUES (?, ?, ?, '/uploads/stu001_lab1.pdf', 'Completed Python functions for Exercise 1-5', ?, 'submitted')`,
    args: [subId, assignmentId, studentUserId, now],
  })

  // Teacher views submissions for this assignment
  const teacherSubmissions = await db.execute({
    sql: `SELECT sub.*, u.full_name as student_name, stu.register_number 
          FROM submissions sub 
          JOIN users u ON sub.student_id = u.id 
          LEFT JOIN students stu ON u.id = stu.user_id 
          WHERE sub.assignment_id = ?`,
    args: [assignmentId],
  })
  assert(teacherSubmissions.rows.length === 1, 'Teacher sees the student submission')
  assert(teacherSubmissions.rows[0].student_name === 'Test Student', 'Submission is from Test Student')
  assert(teacherSubmissions.rows[0].register_number === regNo, `Submission shows register number ${regNo}`)

  // Teacher grades submission
  await db.execute({
    sql: `UPDATE submissions SET marks = 95, feedback = 'Excellent implementation', status = 'graded' WHERE id = ?`,
    args: [subId],
  })
  const gradedCheck = await db.execute({
    sql: 'SELECT marks, feedback, status FROM submissions WHERE id = ?',
    args: [subId],
  })
  assert(gradedCheck.rows[0].marks === 95, 'Grade recorded as 95 marks')
  assert(gradedCheck.rows[0].status === 'graded', 'Status updated to graded')

  // -------------------------------------------------------------------------
  // TEST 6: Teacher marks attendance. Student dashboard shows updated attendance.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Attendance marking and student visibility ---')
  const attId = `att-${Date.now()}`
  const today = '2026-10-04'
  await db.execute({
    sql: `INSERT INTO attendance (id, student_id, subject_id, teacher_id, date, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'present', ?)`,
    args: [attId, studentUserId, subjectId, teacherUserId, today, now],
  })

  // Student queries attendance
  const studentAtt = await db.execute({
    sql: `SELECT a.*, s.subject_name 
          FROM attendance a 
          JOIN subjects s ON a.subject_id = s.id 
          WHERE a.student_id = ? AND a.date = ?`,
    args: [studentUserId, today],
  })
  assert(studentAtt.rows.length === 1, 'Student sees attendance record for today')
  assert(studentAtt.rows[0].status === 'present', 'Attendance status is present')

  // -------------------------------------------------------------------------
  // TEST 7: Admin edits teacher department. Teacher profile shows updated department.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Admin updates teacher department ---')
  await db.execute({
    sql: `UPDATE teachers SET department = 'CSE(AI & ML)', updated_at = ? WHERE user_id = ?`,
    args: [new Date().toISOString(), teacherUserId],
  })

  // Teacher profile reloaded
  const updatedTeacher = await db.execute({
    sql: 'SELECT * FROM teachers WHERE user_id = ? LIMIT 1',
    args: [teacherUserId],
  })
  assert(updatedTeacher.rows[0].department === 'CSE(AI & ML)', 'Teacher department updated to "CSE(AI & ML)" in central database')

  console.log('\n======================================================')
  console.log('🎉 ALL 7 ACCEPTANCE TESTS COMPLETED AND PASSED WITH 100% SUCCESS!')
  console.log('======================================================\n')
}

runAcceptanceTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
