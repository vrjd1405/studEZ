-- =========================================================================
-- StudEZ Enterprise Campus Management Platform - PostgreSQL / Supabase Schema
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  department_code TEXT UNIQUE NOT NULL,
  department_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS / PROFILES TABLE (Extends Supabase auth.users or standalone users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  full_name TEXT NOT NULL,
  phone TEXT,
  profile_photo TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS TABLE (Linked to users)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  register_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  year TEXT NOT NULL, -- '1st Year', '2nd Year', '3rd Year', '4th Year'
  semester INTEGER NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  batch TEXT,
  admission_year INTEGER,
  college TEXT DEFAULT 'Campus Institute of Technology',
  profile_photo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEACHERS TABLE (Linked to users)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  subjects TEXT,
  profile_photo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_code TEXT UNIQUE NOT NULL,
  subject_name TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COURSES / CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT NOT NULL,
  credits INTEGER DEFAULT 3,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TEACHER_SUBJECTS (Class Allocations)
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTES & MATERIALS (Content Targeting)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSIGNMENTS TABLE (Content Targeting)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  attachment_url TEXT,
  max_marks INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  content TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  marks REAL,
  feedback TEXT,
  UNIQUE(assignment_id, student_id)
);

-- 11. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  section TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT DEFAULT 'all',
  department TEXT DEFAULT 'all',
  year TEXT DEFAULT 'all',
  section TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function to check role of current user
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Users RLS
CREATE POLICY "Users can read all public profiles"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can edit own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Notes RLS: Students only see targeted notes; Teachers manage their notes; Admins see all
CREATE POLICY "Students read targeted notes"
  ON public.notes FOR SELECT
  USING (
    get_auth_role() = 'admin' OR
    (get_auth_role() = 'teacher' AND teacher_id = auth.uid()) OR
    (
      get_auth_role() = 'student' AND
      department = (SELECT department FROM public.students WHERE user_id = auth.uid()) AND
      year = (SELECT year FROM public.students WHERE user_id = auth.uid()) AND
      section = (SELECT section FROM public.students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can insert and manage notes"
  ON public.notes FOR ALL
  USING (get_auth_role() IN ('teacher', 'admin'));

-- Submissions RLS: Students submit and view own; Teachers view their assignment submissions
CREATE POLICY "Students manage own submissions"
  ON public.submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Teachers view submissions for assigned tasks"
  ON public.submissions FOR SELECT
  USING (
    assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid()) OR
    get_auth_role() = 'admin'
  );

CREATE POLICY "Teachers grade submissions"
  ON public.submissions FOR UPDATE
  USING (
    assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid()) OR
    get_auth_role() = 'admin'
  );

-- Attendance RLS: Students can only view own attendance; Teachers can mark
CREATE POLICY "Students view own attendance"
  ON public.attendance FOR SELECT
  USING (student_id = auth.uid() OR get_auth_role() IN ('teacher', 'admin'));

CREATE POLICY "Teachers and admins record attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (get_auth_role() IN ('teacher', 'admin'));

-- Initial Departments Seeding
INSERT INTO public.departments (department_code, department_name) VALUES
  ('CSE', 'Computer Science and Engineering'),
  ('CSE(AI & ML)', 'Computer Science & AI/ML'),
  ('ECE', 'Electronics & Communication Engineering'),
  ('EEE', 'Electrical & Electronics Engineering'),
  ('Mechanical', 'Mechanical Engineering'),
  ('Civil', 'Civil Engineering')
ON CONFLICT (department_code) DO NOTHING;
