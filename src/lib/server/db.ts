import { createClient, type Client } from '@libsql/client'
import path from 'path'
import crypto from 'crypto'

let clientInstance: Client | null = null
let schemaInitialized = false

export function getDb(): Client {
  if (!clientInstance) {
    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || process.env.LIBSQL_URL
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN

    if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://') || tursoUrl.startsWith('wss://'))) {
      clientInstance = createClient({
        url: tursoUrl,
        authToken: authToken,
      })
    } else {
      const dbPath = path.resolve(process.cwd(), 'studez.db')
      clientInstance = createClient({
        url: `file:${dbPath.replace(/\\/g, '/')}`,
      })
    }

    if (!schemaInitialized) {
      schemaInitialized = true
      try {
        initSchema(clientInstance)
      } catch (e: any) {
        console.warn('Schema init note:', e?.message)
      }
    }
  }
  return clientInstance
}

export function hashPassword(password: string): string {
  const salt = 'studez_salt_2026'
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function initSchema(db: Client) {
  const schemaQueries = [
    `PRAGMA foreign_keys = ON;`,

    // 1. Users table (Central auth and identity)
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      full_name TEXT NOT NULL,
      phone TEXT,
      profile_photo TEXT,
      account_status TEXT DEFAULT 'active' CHECK(account_status IN ('active', 'inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    // 2. Departments table
    `CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      department_code TEXT UNIQUE NOT NULL,
      department_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,

    // 3. Students table (Linked to users)
    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      register_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      department TEXT NOT NULL,
      section TEXT NOT NULL,
      batch TEXT,
      admission_year INTEGER,
      college TEXT DEFAULT 'Campus Institute of Technology',
      profile_photo TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 4. Teachers table (Linked to users)
    `CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      subjects TEXT,
      profile_photo TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 5. Subjects table
    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      subject_code TEXT UNIQUE NOT NULL,
      subject_name TEXT NOT NULL,
      department_id TEXT,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      credits INTEGER DEFAULT 3,
      created_at TEXT NOT NULL
    );`,

    // 6. Courses / Classes (Academic Sections)
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      course_code TEXT NOT NULL,
      course_name TEXT NOT NULL,
      department_id TEXT,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      teacher_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
    );`,

    // 7. Teacher Subjects (Assignment of Teacher -> Subject -> Department -> Year -> Semester -> Section)
    `CREATE TABLE IF NOT EXISTS teacher_subjects (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );`,

    // 7b. Teacher Student Records (Internal marks, remarks, progress tracked per student under assigned course)
    `CREATE TABLE IF NOT EXISTS teacher_student_records (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      section TEXT,
      internal_marks REAL,
      max_marks REAL DEFAULT 100,
      grade_letter TEXT,
      remarks TEXT,
      updated_at TEXT,
      created_at TEXT,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );`,

    // 8. Notes / Materials (Targeted to Department, Year, Semester, Section)
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT NOT NULL,
      type TEXT DEFAULT 'notes',
      is_private INTEGER DEFAULT 0,
      uploaded_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      type TEXT DEFAULT 'notes',
      is_private INTEGER DEFAULT 0,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 9. Assignments (Targeted to Department, Year, Semester, Section)
    `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT NOT NULL,
      due_date TEXT NOT NULL,
      attachment_url TEXT,
      max_marks INTEGER DEFAULT 100,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 10. Submissions table
    `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      file_url TEXT,
      content TEXT,
      submitted_at TEXT NOT NULL,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'late')),
      marks REAL,
      feedback TEXT,
      UNIQUE(assignment_id, student_id),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 11. Attendance table
    `CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 12. Timetable table
    `CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 13. Announcements table
    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      target_role TEXT DEFAULT 'all',
      department TEXT DEFAULT 'all',
      year TEXT DEFAULT 'all',
      section TEXT DEFAULT 'all',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // 14. Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      target_role TEXT DEFAULT 'all',
      created_by TEXT,
      read_by TEXT DEFAULT '[]',
      read_status INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );`,

    // 15. Sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    // Legacy tables preserved for compatibility with existing tests
    `CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      semester INTEGER DEFAULT 1,
      enrolled_at TEXT NOT NULL,
      UNIQUE(student_id, subject_id),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      type TEXT NOT NULL DEFAULT 'midterm',
      max_marks INTEGER DEFAULT 100,
      created_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      exam_id TEXT,
      marks REAL NOT NULL,
      max_marks REAL NOT NULL,
      grade TEXT,
      semester INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      subject_id TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      end_time TEXT,
      link TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'class',
      status TEXT DEFAULT 'scheduled',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      duration_minutes INTEGER DEFAULT 60,
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_private INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      tool_calls TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
    );`,

    // Optimization Indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notes_target ON notes(department, year, semester, section);`,
    `CREATE INDEX IF NOT EXISTS idx_assignments_target ON assignments(department, year, semester, section);`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);`,
    `CREATE INDEX IF NOT EXISTS idx_timetable_target ON timetable(department, year, semester, section);`,
    `CREATE INDEX IF NOT EXISTS idx_teacher_subjects ON teacher_subjects(teacher_id, subject_id);`
  ]

  ;(async () => {
    try {
      for (const query of schemaQueries) {
        try {
          await db.execute(query)
        } catch {}
      }

      // Safe defensive migrations for backward compatibility across all components
      const safeMigrations = [
        'ALTER TABLE users ADD COLUMN profile_photo TEXT;',
        'ALTER TABLE users ADD COLUMN avatar_url TEXT;',
        'ALTER TABLE users ADD COLUMN department TEXT;',
        'ALTER TABLE users ADD COLUMN year INTEGER;',
        'ALTER TABLE users ADD COLUMN password_hash TEXT;',
        'ALTER TABLE students ADD COLUMN roll_number TEXT;',
        'ALTER TABLE teachers ADD COLUMN roll_number TEXT;',
        'ALTER TABLE subjects ADD COLUMN name TEXT;',
        'ALTER TABLE subjects ADD COLUMN code TEXT;',
        'ALTER TABLE subjects ADD COLUMN teacher_id TEXT;',
        'ALTER TABLE subjects ADD COLUMN description TEXT;',
        'ALTER TABLE notes ADD COLUMN type TEXT DEFAULT "notes";',
        'ALTER TABLE notes ADD COLUMN is_private INTEGER DEFAULT 0;',
        'ALTER TABLE notes ADD COLUMN uploaded_by TEXT;',
        'ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT "info";',
        'ALTER TABLE notifications ADD COLUMN target_role TEXT DEFAULT "all";',
        'ALTER TABLE notifications ADD COLUMN created_by TEXT;',
        'ALTER TABLE notifications ADD COLUMN read_by TEXT DEFAULT "[]";',
      ]
      for (const mig of safeMigrations) {
        try {
          await db.execute(mig)
        } catch {
          // Column already exists or up to date
        }
      }

      // Ensure subjects code and name columns are in sync
      try {
        await db.execute(`UPDATE subjects SET name = subject_name WHERE (name IS NULL OR name = '') AND subject_name IS NOT NULL`)
        await db.execute(`UPDATE subjects SET code = subject_code WHERE (code IS NULL OR code = '') AND subject_code IS NOT NULL`)
        await db.execute(`UPDATE subjects SET subject_name = name WHERE (subject_name IS NULL OR subject_name = '') AND name IS NOT NULL`)
        await db.execute(`UPDATE subjects SET subject_code = code WHERE (subject_code IS NULL OR subject_code = '') AND code IS NOT NULL`)
      } catch {}

      await seedInitialData(db)
    } catch (err) {
      console.error('Error initializing database schema:', err)
    }
  })()
}

async function seedInitialData(db: Client) {
  const now = new Date().toISOString()
  const defaultPasswordHash = hashPassword('password123')

  // Check if users need seeding
  const userCheck = await db.execute('SELECT COUNT(*) as count FROM users')
  if (Number(userCheck.rows[0]?.count || 0) === 0) {
    // 1. Seed Departments
    const departments = [
      { id: 'dept-cse', code: 'CSE', name: 'Computer Science and Engineering' },
      { id: 'dept-aiml', code: 'CSE(AI & ML)', name: 'Computer Science & AI/ML' },
      { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' },
      { id: 'dept-eee', code: 'EEE', name: 'Electrical & Electronics Engineering' },
      { id: 'dept-mech', code: 'Mechanical', name: 'Mechanical Engineering' },
      { id: 'dept-civil', code: 'Civil', name: 'Civil Engineering' },
    ]

    for (const d of departments) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO departments (id, department_code, department_name, created_at) VALUES (?, ?, ?, ?)',
        args: [d.id, d.code, d.name, now],
      })
    }

    // 2. Seed Initial Admin Account
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
            VALUES ('user-admin-1', 'admin@campus.edu', ?, 'admin', 'Campus Dean Office', '+1 555-0100', 'active', ?, ?)`,
      args: [defaultPasswordHash, now, now],
    })

    // 3. Seed Initial Teacher Accounts
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
            VALUES ('user-teacher-1', 'teacher@campus.edu', ?, 'teacher', 'Dr. Senthil Velan', '+1 555-0143', 'active', ?, ?)`,
      args: [defaultPasswordHash, now, now],
    })

    await db.execute({
      sql: `INSERT INTO teachers (id, user_id, employee_id, full_name, email, phone, department, designation, subjects, status, created_at, updated_at)
            VALUES ('tch-1', 'user-teacher-1', 'EMP101', 'Dr. Senthil Velan', 'teacher@campus.edu', '+1 555-0143', 'CSE', 'Professor & HOD', 'Problem Solving and Python Programming, Data Structures', 'active', ?, ?)`,
      args: [now, now],
    })

    // 4. Seed Initial Student Account
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, role, full_name, phone, account_status, created_at, updated_at)
            VALUES ('user-student-1', 'student@campus.edu', ?, 'student', 'Alex Johnson', '+1 555-0192', 'active', ?, ?)`,
      args: [defaultPasswordHash, now, now],
    })

    await db.execute({
      sql: `INSERT INTO students (id, user_id, register_number, full_name, email, phone, year, semester, department, section, batch, admission_year, college, status, created_at, updated_at)
            VALUES ('stu-1', 'user-student-1', 'REG2024CS001', 'Alex Johnson', 'student@campus.edu', '+1 555-0192', '1st Year', 1, 'CSE', 'A', '2024-2028', 2024, 'Campus Institute of Technology', 'active', ?, ?)`,
      args: [now, now],
    })

    // 5. Seed Core Subjects
    const subjects = [
      { id: 'subj-cs101', code: 'BACSE101', name: 'Problem Solving and Python Programming', dept: 'CSE', year: '1st Year', sem: 1, credits: 4 },
      { id: 'subj-cs102', code: 'BACSE102', name: 'Engineering Mathematics I', dept: 'CSE', year: '1st Year', sem: 1, credits: 4 },
      { id: 'subj-cs201', code: 'CS301', name: 'Data Structures and Algorithms', dept: 'CSE', year: '2nd Year', sem: 3, credits: 4 },
      { id: 'subj-cs202', code: 'CS302', name: 'Database Management Systems', dept: 'CSE', year: '2nd Year', sem: 3, credits: 4 },
    ]

    for (const s of subjects) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO subjects (id, subject_code, subject_name, code, name, department, year, semester, credits, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [s.id, s.code, s.name, s.code, s.name, s.dept, s.year, s.sem, s.credits, now],
      })
    }

    // 6. Assign Teacher to Classes (teacher_subjects)
    await db.execute({
      sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
            VALUES ('ts-1', 'user-teacher-1', 'subj-cs101', 'CSE', '1st Year', 1, 'A', ?)`,
      args: [now],
    })
    await db.execute({
      sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
            VALUES ('ts-2', 'user-teacher-1', 'subj-cs201', 'CSE', '2nd Year', 3, 'B', ?)`,
      args: [now],
    })

    // 7. Seed Targeted Notes
    await db.execute({
      sql: `INSERT INTO notes (id, title, description, file_url, subject_id, teacher_id, department, year, semester, section, created_at, updated_at)
            VALUES ('note-1', 'Unit 1: Python Fundamentals and Syntax Notes', 'Introduction to variables, memory references, loops, and functions.', 'https://storage.campus.edu/notes/python_unit1.pdf', 'subj-cs101', 'user-teacher-1', 'CSE', '1st Year', 1, 'A', ?, ?)`,
      args: [now, now],
    })
    await db.execute({
      sql: `INSERT INTO notes (id, title, description, file_url, subject_id, teacher_id, department, year, semester, section, created_at, updated_at)
            VALUES ('note-2', 'Unit 2: Balanced Search Trees (AVL) Guide', 'Detailed analysis of LL, RR, LR, and RL tree rotations.', 'https://storage.campus.edu/notes/avl_trees.pdf', 'subj-cs201', 'user-teacher-1', 'CSE', 'all', 1, 'A', ?, ?)`,
      args: [now, now],
    })

    // 8. Seed Targeted Assignments
    await db.execute({
      sql: `INSERT INTO assignments (id, title, description, subject_id, teacher_id, department, year, semester, section, due_date, attachment_url, max_marks, created_at, updated_at)
            VALUES ('asg-1', 'Python Recursive Functions & Array Problems', 'Solve exercises 1 through 10 in the lab manual.', 'subj-cs101', 'user-teacher-1', 'CSE', '1st Year', 1, 'A', '2026-10-25T23:59:00Z', null, 100, ?, ?)`,
      args: [now, now],
    })

    // 9. Seed Attendance for Alex Johnson
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
    for (let i = 0; i < dates.length; i++) {
      await db.execute({
        sql: `INSERT INTO attendance (id, student_id, subject_id, teacher_id, date, status, created_at)
              VALUES (?, 'user-student-1', 'subj-cs101', 'user-teacher-1', ?, 'present', ?)`,
        args: [`att-seed-${i}`, dates[i], now],
      })
    }

    // 10. Seed Timetable
    const timetableSlots = [
      { id: 'tt-1', dept: 'CSE', year: '1st Year', sem: 1, sec: 'A', subj: 'subj-cs101', teacher: 'user-teacher-1', day: 'Monday', start: '09:00 AM', end: '10:00 AM', room: 'Hall 101' },
      { id: 'tt-2', dept: 'CSE', year: '1st Year', sem: 1, sec: 'A', subj: 'subj-cs102', teacher: 'user-teacher-1', day: 'Monday', start: '10:00 AM', end: '11:00 AM', room: 'Hall 101' },
      { id: 'tt-3', dept: 'CSE', year: '1st Year', sem: 1, sec: 'A', subj: 'subj-cs101', teacher: 'user-teacher-1', day: 'Wednesday', start: '11:00 AM', end: '12:00 PM', room: 'Hall 101' },
    ]
    for (const t of timetableSlots) {
      await db.execute({
        sql: `INSERT INTO timetable (id, department, year, semester, section, subject_id, teacher_id, day, start_time, end_time, room, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [t.id, t.dept, t.year, t.sem, t.sec, t.subj, t.teacher, t.day, t.start, t.end, t.room, now],
      })
    }

    // 11. Seed Announcements
    await db.execute({
      sql: `INSERT INTO announcements (id, title, content, created_by, target_role, department, year, section, created_at, updated_at)
            VALUES ('ann-1', 'Welcome to the New Academic Session', 'All 1st Year CSE students are requested to report to Auditorium Hall by 9:00 AM tomorrow.', 'user-admin-1', 'all', 'CSE', '1st Year', 'A', ?, ?)`,
      args: [now, now],
    })

    // 12. Enrollments legacy seed for student
    await db.execute({
      sql: `INSERT OR IGNORE INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
            VALUES ('enr-1', 'user-student-1', 'subj-cs101', 1, ?)`,
      args: [now],
    })
  }

  // --- Seed Documents for Syllabus RAG & Study Notes if empty ---
  const docCheck = await db.execute('SELECT COUNT(*) as count FROM documents')
  if (Number(docCheck.rows[0]?.count || 0) === 0) {
    const seedDocs = [
      {
        id: 'doc-avl-1',
        user_id: 'user-teacher-1',
        subject_id: 'subj-cs201',
        title: 'AVL Trees & Self-Balancing Binary Search Trees Guide',
        file_name: 'avl_trees_complete_guide.pdf',
        file_type: 'pdf',
        is_private: 0,
        content: `AVL Trees & Balanced Search Trees Overview:
An AVL tree is a self-balancing binary search tree (BST) where the height difference between left and right subtrees (the Balance Factor) of any node cannot exceed 1.
Balance Factor Definition:
Balance Factor (BF) = height(left_subtree) - height(right_subtree).
Valid BF values in an AVL tree are -1, 0, and +1. If BF becomes >= 2 or <= -2, rebalancing is performed via tree rotations.

The Four Rotations:
1. Left-Left (LL) Case:
- Cause: Insertion into the left subtree of the left child.
- Fix: Perform a Single Right Rotation on the imbalanced ancestor node.
2. Right-Right (RR) Case:
- Cause: Insertion into the right subtree of the right child.
- Fix: Perform a Single Left Rotation on the imbalanced ancestor node.
3. Left-Right (LR) Case:
- Cause: Insertion into the right subtree of the left child.
- Fix: Perform a Double Rotation (Left Rotation on the left child, followed by a Right Rotation on the root node).
4. Right-Left (RL) Case:
- Cause: Insertion into the left subtree of the right child.
- Fix: Perform a Double Rotation (Right Rotation on the right child, followed by a Left Rotation on the root node).

Complexity:
Search, Insertion, and Deletion all take strict O(log n) worst-case time because tree height is strictly bounded by h <= 1.44 log2(n).`,
      },
      {
        id: 'doc-dbms-1',
        user_id: 'user-teacher-1',
        subject_id: 'subj-cs202',
        title: 'Database Normalization Comprehensive Guide (1NF, 2NF, 3NF, BCNF)',
        file_name: 'dbms_normalization_summary.pdf',
        file_type: 'pdf',
        is_private: 0,
        content: `Database Normalization Guide:
Normalization is the process of organizing database tables to reduce data redundancy and eliminate insertion, update, and deletion anomalies.

1. First Normal Form (1NF):
- Every column must contain atomic (indivisible) values.
- No repeating groups or arrays allowed in a single row.
- Each row must have a unique identifier (Primary Key).

2. Second Normal Form (2NF):
- Must already be in 1NF.
- Eliminates Partial Dependency: All non-prime attributes must be fully functionally dependent on the entire primary key, not just a subset of a composite primary key.

3. Third Normal Form (3NF):
- Must already be in 2NF.
- Eliminates Transitive Dependency: Non-prime attributes must not depend on other non-prime attributes (i.e. X -> Y and Y -> Z where Z depends on X transitively).
- Formal condition: For every non-trivial functional dependency X -> A, either X is a superkey or A is a prime attribute.

4. Boyce-Codd Normal Form (BCNF):
- A stricter version of 3NF.
- For every non-trivial functional dependency X -> A, X must be a superkey.`,
      },
      {
        id: 'doc-py-1',
        user_id: 'user-teacher-1',
        subject_id: 'subj-cs101',
        title: 'Python Problem Solving and Recursion Handbook',
        file_name: 'python_recursion_and_arrays.pdf',
        file_type: 'pdf',
        is_private: 0,
        content: `Python Problem Solving and Recursion:
Recursion is a programming technique where a function calls itself directly or indirectly to solve a smaller instance of the same problem.
Key Components of Every Recursive Function:
1. Base Case: The condition under which recursion terminates, preventing infinite call stacks and stack overflow errors.
2. Recursive Step: The rule that reduces the input size towards the base case.

Examples:
- Factorial: fact(n) = 1 if n <= 1 else n * fact(n-1)
- Fibonacci: fib(n) = n if n <= 1 else fib(n-1) + fib(n-2)
- Binary Search: Split array into halves and recursively search sub-ranges in O(log n) time.`,
      }
    ]

    for (const d of seedDocs) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO documents (id, user_id, subject_id, title, file_name, file_type, content, is_private, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [d.id, d.user_id, d.subject_id, d.title, d.file_name, d.file_type, d.content, d.is_private, now],
      })
    }
  }

  // --- Seed Upcoming Exams if empty ---
  const examCheck = await db.execute('SELECT COUNT(*) as count FROM exams')
  if (Number(examCheck.rows[0]?.count || 0) === 0) {
    const seedExams = [
      {
        id: 'exam-1',
        subject_id: 'subj-cs101',
        title: 'Midterm Examination: Problem Solving & Python',
        date: '2026-10-18',
        start_time: '10:00 AM',
        end_time: '12:00 PM',
        room: 'Lecture Hall 101',
        type: 'midterm',
        max_marks: 50,
      },
      {
        id: 'exam-2',
        subject_id: 'subj-cs102',
        title: 'Engineering Mathematics Midterm',
        date: '2026-10-22',
        start_time: '02:00 PM',
        end_time: '04:00 PM',
        room: 'Auditorium Hall B',
        type: 'midterm',
        max_marks: 50,
      },
      {
        id: 'exam-3',
        subject_id: 'subj-cs201',
        title: 'Data Structures & Algorithms Practical Lab Exam',
        date: '2026-10-28',
        start_time: '09:30 AM',
        end_time: '12:30 PM',
        room: 'Computer Lab 3',
        type: 'practical',
        max_marks: 100,
      },
    ]

    for (const e of seedExams) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO exams (id, subject_id, title, date, start_time, end_time, room, type, max_marks, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [e.id, e.subject_id, e.title, e.date, e.start_time, e.end_time, e.room, e.type, e.max_marks, now],
      })
    }
  }

  // --- Seed Upcoming Meetings if empty ---
  const meetCheck = await db.execute('SELECT COUNT(*) as count FROM meetings')
  if (Number(meetCheck.rows[0]?.count || 0) === 0) {
    const seedMeetings = [
      {
        id: 'meet-1',
        title: 'AVL Trees & Balancing Algorithm Live Tutorial',
        description: 'Interactive walkthrough of LL, RR, LR and RL rotations with code exercises.',
        subject_id: 'subj-cs201',
        date: '2026-10-15',
        time: '02:00 PM',
        end_time: '03:30 PM',
        link: 'https://meet.google.com/xyz-stud-cop',
        type: 'class',
        created_by: 'user-teacher-1',
      },
      {
        id: 'meet-2',
        title: 'Python Recursion & Array Workshop',
        description: 'Office hours and doubt clearing for Lab Assignment 1.',
        subject_id: 'subj-cs101',
        date: '2026-10-16',
        time: '04:00 PM',
        end_time: '05:00 PM',
        link: 'https://meet.google.com/abc-pyth-lab',
        type: 'office_hours',
        created_by: 'user-teacher-1',
      },
    ]

    for (const m of seedMeetings) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO meetings (id, title, description, subject_id, date, time, end_time, link, type, status, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        args: [m.id, m.title, m.description, m.subject_id, m.date, m.time, m.end_time, m.link, m.type, m.created_by, now],
      })
    }
  }

  // --- Seed Grades if empty ---
  const gradeCheck = await db.execute('SELECT COUNT(*) as count FROM grades')
  if (Number(gradeCheck.rows[0]?.count || 0) === 0) {
    const seedGrades = [
      {
        id: 'grd-1',
        student_id: 'user-student-1',
        subject_id: 'subj-cs101',
        marks: 92,
        max_marks: 100,
        grade: 'A+',
        semester: 1,
      },
      {
        id: 'grd-2',
        student_id: 'user-student-1',
        subject_id: 'subj-cs102',
        marks: 88,
        max_marks: 100,
        grade: 'A',
        semester: 1,
      },
    ]

    for (const g of seedGrades) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO grades (id, student_id, subject_id, exam_id, marks, max_marks, grade, semester, created_at)
              VALUES (?, ?, ?, null, ?, ?, ?, ?, ?)`,
        args: [g.id, g.student_id, g.subject_id, g.marks, g.max_marks, g.grade, g.semester, now],
      })
    }
  }

  // --- Ensure all students have enrollments and attendance records ---
  try {
    const allStudents = await db.execute("SELECT id FROM users WHERE role = 'student'")
    for (const stu of allStudents.rows) {
      const stuId = String(stu.id)
      // Enroll in core subjects
      await db.execute({
        sql: `INSERT OR IGNORE INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
              VALUES (?, ?, 'subj-cs101', 1, ?)`,
        args: [`enr-${stuId}-cs101`, stuId, now],
      })
      await db.execute({
        sql: `INSERT OR IGNORE INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
              VALUES (?, ?, 'subj-cs102', 1, ?)`,
        args: [`enr-${stuId}-cs102`, stuId, now],
      })

      // Ensure at least 3 attendance records for metrics
      const attDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']
      for (let i = 0; i < attDates.length; i++) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO attendance (id, student_id, subject_id, teacher_id, date, status, created_at)
                VALUES (?, ?, 'subj-cs101', 'user-teacher-1', ?, 'present', ?)`,
          args: [`att-${stuId}-${i}`, stuId, attDates[i], now],
        })
      }
    }
  } catch {}

  console.log('studEZ Central Relational Database upgraded and seeded successfully.')
}
