export type UserRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  department: string | null
  year: number | string | null
  phone: string | null
  created_at: string
  updated_at: string
  account_status?: 'active' | 'inactive'
  register_number?: string | null
  semester?: number | null
  section?: string | null
  employee_id?: string | null
  student?: Student
  teacher?: Teacher
}

export interface Department {
  id: string
  department_code: string
  department_name: string
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  register_number: string
  full_name: string
  email: string
  phone: string | null
  year: string
  semester: number
  department: string
  section: string
  batch: string | null
  admission_year: number | null
  college: string | null
  profile_photo: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  user_id: string
  employee_id: string
  full_name: string
  email: string
  phone: string | null
  department: string
  designation: string
  subjects: string | null
  profile_photo: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  department: string
  semester: number
  teacher_id?: string | null
  description?: string | null
  credits: number
  created_at: string
  teacher?: Profile
  year?: string
  department_id?: string | null
  subject_code?: string
  subject_name?: string
}

export interface Course {
  id: string
  course_code: string
  course_name: string
  department_id?: string | null
  department: string
  year: string
  semester: number
  section: string
  credits: number
  teacher_id?: string | null
  created_at: string
  teacher_name?: string
}

export interface TeacherSubject {
  id: string
  teacher_id: string
  subject_id: string
  department: string
  year: string
  semester: number
  section: string
  created_at: string
  teacher?: Profile
  subject?: Subject
}

export interface Note {
  id: string
  title: string
  description: string | null
  file_url: string
  subject_id: string
  teacher_id: string
  department: string
  year: string
  semester: number
  section: string
  created_at: string
  updated_at: string
  subject_code?: string
  subject_name?: string
  teacher_name?: string
}

export interface Material {
  id: string
  subject_id: string
  title: string
  description: string | null
  file_url: string | null
  type: 'notes' | 'slides' | 'video' | 'link' | 'document'
  uploaded_by: string
  created_at: string
  subject?: Subject
  uploader?: Profile
}

export interface Assignment {
  id: string
  subject_id: string
  title: string
  description: string | null
  due_date: string
  max_marks: number
  created_by?: string
  teacher_id?: string
  department?: string
  year?: string
  semester?: number
  section?: string
  attachment_url?: string | null
  created_at: string
  updated_at?: string
  subject?: Subject
  subject_code?: string
  subject_name?: string
  teacher_name?: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  content: string | null
  submitted_at: string
  status?: 'submitted' | 'graded' | 'late'
  marks: number | null
  feedback: string | null
  graded_at?: string | null
  student_name?: string
  student_email?: string
  register_number?: string
  assignment_title?: string
  assignment?: Assignment
  student?: {
    id?: string
    full_name?: string
    email?: string
    department?: string
    register_number?: string
  }
}

export type AssignmentSubmission = Submission

export interface Attendance {
  id: string
  student_id: string
  subject_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  marked_by?: string
  teacher_id?: string
  created_at: string
  subject?: Subject
  student?: Profile
  student_name?: string
  register_number?: string
  subject_name?: string
}

export interface TimetableSlot {
  id: string
  department: string
  year: string
  semester: number
  section: string
  subject_id: string
  teacher_id: string
  day: string
  start_time: string
  end_time: string
  room: string
  created_at: string
  subject_code?: string
  subject_name?: string
  teacher_name?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  target_role: string
  department: string
  year: string
  section: string
  created_at: string
  updated_at: string
  author_name?: string
}

export interface Notification {
  id: string
  user_id?: string | null
  title: string
  message: string
  read_status?: number
  created_at: string
  type?: 'info' | 'warning' | 'success' | 'error'
  read_by?: string[]
  target_role?: string
  created_by?: string
}

export interface Exam {
  id: string
  subject_id: string
  title: string
  date: string
  start_time: string
  end_time: string
  room: string | null
  type: 'midterm' | 'final' | 'quiz' | 'practical'
  max_marks: number
  created_at: string
  subject?: Subject
}

export interface Grade {
  id: string
  student_id: string
  subject_id: string
  exam_id: string | null
  marks: number
  max_marks: number
  grade: string | null
  semester: number
  created_at: string
  subject?: Subject
  student?: Profile
  exam?: Exam
}

export interface Meeting {
  id: string
  title: string
  description: string | null
  subject_id?: string | null
  date: string
  time: string
  end_time: string | null
  link: string | null
  type: 'class' | 'office_hours' | 'event' | 'other'
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  creator?: Profile
}

export interface StudyPlan {
  id: string
  student_id: string
  subject_id: string
  title: string
  description?: string | null
  start_date: string
  end_date: string
  status?: 'active' | 'completed' | 'paused'
  created_at: string
  subject?: Subject
  tasks?: StudyPlanTask[]
}

export interface StudyPlanTask {
  id: string
  plan_id: string
  title: string
  description: string | null
  due_date: string
  completed: boolean
  created_at: string
}
