import { createClient } from '@libsql/client';
import path from 'path';

const db = createClient({ url: `file:${path.resolve(process.cwd(), 'studez.db').replace(/\\/g, '/')}` });

async function seedMissing() {
  const now = new Date().toISOString();
  
  // 1. Sync subjects code & name
  await db.execute(`UPDATE subjects SET name = subject_name WHERE (name IS NULL OR name = '') AND subject_name IS NOT NULL`);
  await db.execute(`UPDATE subjects SET code = subject_code WHERE (code IS NULL OR code = '') AND subject_code IS NOT NULL`);
  await db.execute(`UPDATE subjects SET subject_name = name WHERE (subject_name IS NULL OR subject_name = '') AND name IS NOT NULL`);
  await db.execute(`UPDATE subjects SET subject_code = code WHERE (subject_code IS NULL OR subject_code = '') AND code IS NOT NULL`);

  // 2. Documents for Syllabus RAG
  const docCheck = await db.execute('SELECT COUNT(*) as count FROM documents');
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
    ];

    for (const d of seedDocs) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO documents (id, user_id, subject_id, title, file_name, file_type, content, is_private, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [d.id, d.user_id, d.subject_id, d.title, d.file_name, d.file_type, d.content, d.is_private, now],
      });
    }
    console.log('Seeded documents:', seedDocs.length);
  }

  // 3. Exams
  const examCheck = await db.execute('SELECT COUNT(*) as count FROM exams');
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
    ];

    for (const e of seedExams) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO exams (id, subject_id, title, date, start_time, end_time, room, type, max_marks, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [e.id, e.subject_id, e.title, e.date, e.start_time, e.end_time, e.room, e.type, e.max_marks, now],
      });
    }
    console.log('Seeded exams:', seedExams.length);
  }

  // 4. Meetings
  const meetCheck = await db.execute('SELECT COUNT(*) as count FROM meetings');
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
    ];

    for (const m of seedMeetings) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO meetings (id, title, description, subject_id, date, time, end_time, link, type, status, created_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        args: [m.id, m.title, m.description, m.subject_id, m.date, m.time, m.end_time, m.link, m.type, m.created_by, now],
      });
    }
    console.log('Seeded meetings:', seedMeetings.length);
  }

  // 5. Grades
  const gradeCheck = await db.execute('SELECT COUNT(*) as count FROM grades');
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
    ];

    for (const g of seedGrades) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO grades (id, student_id, subject_id, exam_id, marks, max_marks, grade, semester, created_at)
              VALUES (?, ?, ?, null, ?, ?, ?, ?, ?)`,
        args: [g.id, g.student_id, g.subject_id, g.marks, g.max_marks, g.grade, g.semester, now],
      });
    }
    console.log('Seeded grades:', seedGrades.length);
  }

  // 6. Ensure enrollments and attendance for all students (including Google OAuth users)
  const students = await db.execute("SELECT id FROM users WHERE role = 'student'");
  for (const stu of students.rows) {
    const stuId = String(stu.id);
    await db.execute({
      sql: `INSERT OR IGNORE INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
            VALUES (?, ?, 'subj-cs101', 1, ?)`,
      args: [`enr-${stuId}-cs101`, stuId, now],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO enrollments (id, student_id, subject_id, semester, enrolled_at)
            VALUES (?, ?, 'subj-cs102', 1, ?)`,
      args: [`enr-${stuId}-cs102`, stuId, now],
    });

    const attDates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
    for (let i = 0; i < attDates.length; i++) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO attendance (id, student_id, subject_id, teacher_id, date, status, created_at)
              VALUES (?, ?, 'subj-cs101', 'user-teacher-1', ?, 'present', ?)`,
        args: [`att-${stuId}-${i}`, stuId, attDates[i], now],
      });
    }
  }

  // 7. Ensure all registered teachers have assigned classes in teacher_subjects
  const teachers = await db.execute("SELECT id, full_name, email FROM users WHERE role = 'teacher'");
  for (const t of teachers.rows) {
    const tId = String(t.id);
    const existing = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM teacher_subjects WHERE teacher_id = ?',
      args: [tId],
    });
    if (Number(existing.rows[0]?.count || 0) === 0) {
      console.log(`Assigning teaching classes to teacher ${t.full_name} (${tId})`);
      await db.execute({
        sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
              VALUES (?, ?, 'subj-cs101', 'CSE', '1st Year', 1, 'A', ?)`,
        args: [`ts-${tId}-1`, tId, now],
      });
      await db.execute({
        sql: `INSERT INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
              VALUES (?, ?, 'subj-1791183402574-gx26', 'Mechanical Engineering', '1st Year', 1, 'A', ?)`,
        args: [`ts-${tId}-2`, tId, now],
      });
    }
  }

  // 8. Ensure standard teacher@campus.edu user exists
  const teacherCheck = await db.execute("SELECT id FROM users WHERE email = 'teacher@campus.edu'");
  if (teacherCheck.rows.length === 0) {
    const hash = '4cb48ed6cefe9853cacd04ff0781db81bcdc417641761b637addc5cc000b2c69';
    await db.execute({
      sql: `INSERT INTO users (id, full_name, email, role, password_hash, account_status, created_at, updated_at)
            VALUES ('user-teacher-standard', 'Faculty Instructor', 'teacher@campus.edu', 'teacher', ?, 'active', ?, ?)`,
      args: [hash, now, now]
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO teachers (id, user_id, full_name, email, department, designation, status, created_at, updated_at)
            VALUES ('tch-standard', 'user-teacher-standard', 'Faculty Instructor', 'teacher@campus.edu', 'CSE', 'Assistant Professor', 'active', ?, ?)`,
      args: [now, now]
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
            VALUES ('ts-teacher-std-1', 'user-teacher-standard', 'subj-cs101', 'CSE', '1st Year', 1, 'A', ?)`,
      args: [now]
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id, department, year, semester, section, created_at)
            VALUES ('ts-teacher-std-2', 'user-teacher-standard', 'subj-cs201', 'CSE', '2nd Year', 3, 'B', ?)`,
      args: [now]
    });
    console.log('Seeded standard teacher@campus.edu account.');
  }

  console.log('Database verification and seeding completed successfully!');
}

seedMissing();
