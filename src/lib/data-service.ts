import type {
  Profile,
  Subject,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Material,
  Exam,
  Grade,
  Meeting,
  Notification,
  StudyPlan,
  StudyPlanTask,
  UserRole,
} from '@/types'

// Check if live Supabase is configured with non-placeholder credentials
export function isLiveSupabaseConfigured(): boolean {
  return false
}

// Broadcast event for realtime UI sync across tabs & components
export function triggerDataChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('studez_data_changed'))
  }
}

// ============================================
// FULL-STACK RELATIONAL DATA SERVICE (DB-BACKED)
// ============================================
export const DataService = {
  // --- Profiles / Users ---
  async getProfiles(role?: UserRole): Promise<Profile[]> {
    try {
      const res = await fetch(`/api/users${role ? `?role=${role}` : ''}`)
      if (res.ok) {
        const users = await res.json()
        return users as Profile[]
      }
    } catch (err) {
      console.error('Failed to get profiles from database:', err)
    }
    return []
  },

  async getProfile(id: string): Promise<Profile | null> {
    const profiles = await this.getProfiles()
    return profiles.find((p) => p.id === id) || null
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { password?: string; student?: any; teacher?: any }): Promise<Profile | null> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        const newProf = await res.json()
        triggerDataChange()
        return newProf
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create user')
    } catch (err) {
      console.error('API createProfile failed:', err)
      throw err
    }
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        triggerDataChange()
        return await res.json()
      }
    } catch (err) {
      console.error('API updateProfile failed:', err)
    }
    return null
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteProfile failed:', err)
    }
    return false
  },

  // --- Subjects ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects')
      if (res.ok) {
        const data = await res.json()
        return data as Subject[]
      }
    } catch (err) {
      console.error('Failed to fetch subjects from DB:', err)
    }
    return []
  },

  async createSubject(subject: Omit<Subject, 'id' | 'created_at'>): Promise<Subject | null> {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      })
      if (res.ok) {
        const newSub = await res.json()
        triggerDataChange()
        return newSub
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create subject')
    } catch (err) {
      console.error('API createSubject failed:', err)
      throw err
    }
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteSubject failed:', err)
    }
    return false
  },

  // --- Enrollments ---
  async enrollStudent(studentId: string, subjectId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, subject_id: subjectId }),
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API enrollStudent failed:', err)
    }
    return false
  },

  // --- Attendance ---
  async getAttendance(studentId?: string, subjectId?: string): Promise<Attendance[]> {
    try {
      const params = new URLSearchParams()
      if (studentId) params.append('student_id', studentId)
      if (subjectId) params.append('subject_id', subjectId)
      const url = `/api/attendance${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data as Attendance[]
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err)
    }
    return []
  },

  async markAttendance(data: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance | null> {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const result = await res.json()
        triggerDataChange()
        return result.attendance || result
      }
    } catch (err) {
      console.error('API markAttendance failed:', err)
    }
    return null
  },

  async bulkRecordAttendance(records: Array<Omit<Attendance, 'id' | 'created_at'>>): Promise<boolean> {
    try {
      for (const rec of records) {
        await this.markAttendance(rec)
      }
      triggerDataChange()
      return true
    } catch (err) {
      console.error('bulkRecordAttendance failed:', err)
      return false
    }
  },

  // --- Assignments ---
  async getAssignments(subjectId?: string): Promise<Assignment[]> {
    try {
      const url = `/api/assignments${subjectId ? `?subject_id=${subjectId}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data as Assignment[]
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    }
    return []
  },

  async createAssignment(assignment: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment | null> {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      })
      if (res.ok) {
        const newAsg = await res.json()
        triggerDataChange()
        return newAsg
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create assignment')
    } catch (err) {
      console.error('API createAssignment failed:', err)
      throw err
    }
  },

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/assignments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteAssignment failed:', err)
    }
    return false
  },

  // --- Submissions ---
  async getSubmissions(assignmentId?: string, studentId?: string): Promise<AssignmentSubmission[]> {
    try {
      const params = new URLSearchParams()
      if (assignmentId) params.append('assignment_id', assignmentId)
      if (studentId) params.append('student_id', studentId)
      const res = await fetch(`/api/submissions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        return data as AssignmentSubmission[]
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    }
    return []
  },

  async submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submitted_at' | 'graded_at' | 'marks' | 'feedback'> & { status?: 'submitted' | 'graded' | 'late' }): Promise<AssignmentSubmission | null> {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      })
      if (res.ok) {
        const data = await res.json()
        triggerDataChange()
        return data
      }
    } catch (err) {
      console.error('API submitAssignment failed:', err)
    }
    return null
  },

  async gradeSubmission(id: string, marks: number, feedback?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, marks, feedback }),
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API gradeSubmission failed:', err)
    }
    return false
  },

  // --- Materials / Notes ---
  async getMaterials(subjectId?: string): Promise<Material[]> {
    try {
      const url = `/api/materials${subjectId ? `?subject_id=${subjectId}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data as Material[]
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err)
    }
    return []
  },

  async createMaterial(material: Omit<Material, 'id' | 'created_at'>): Promise<Material | null> {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      })
      if (res.ok) {
        const newMat = await res.json()
        triggerDataChange()
        return newMat
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create material')
    } catch (err) {
      console.error('API createMaterial failed:', err)
      throw err
    }
  },

  async deleteMaterial(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/materials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteMaterial failed:', err)
    }
    return false
  },

  // --- Exams ---
  async getExams(subjectId?: string): Promise<Exam[]> {
    try {
      const url = `/api/exams${subjectId ? `?subject_id=${subjectId}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data as Exam[]
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err)
    }
    return []
  },

  async createExam(exam: Omit<Exam, 'id' | 'created_at'>): Promise<Exam | null> {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      })
      if (res.ok) {
        const newExam = await res.json()
        triggerDataChange()
        return newExam
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create exam')
    } catch (err) {
      console.error('API createExam failed:', err)
      throw err
    }
  },

  async deleteExam(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/exams?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteExam failed:', err)
    }
    return false
  },

  // --- Grades ---
  async getGrades(studentId?: string): Promise<Grade[]> {
    try {
      const url = `/api/grades${studentId ? `?student_id=${studentId}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data as Grade[]
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err)
    }
    return []
  },

  async createGrade(grade: Omit<Grade, 'id' | 'created_at'>): Promise<Grade | null> {
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grade),
      })
      if (res.ok) {
        const newGrd = await res.json()
        triggerDataChange()
        return newGrd
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to record grade')
    } catch (err) {
      console.error('API createGrade failed:', err)
      throw err
    }
  },

  async recordGrade(grade: Omit<Grade, 'id' | 'created_at'>): Promise<Grade | null> {
    return this.createGrade(grade)
  },

  async deleteGrade(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/grades?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteGrade failed:', err)
    }
    return false
  },

  // --- Meetings ---
  async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await fetch('/api/meetings')
      if (res.ok) {
        const data = await res.json()
        return data as Meeting[]
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    }
    return []
  },

  async createMeeting(meeting: Omit<Meeting, 'id' | 'created_at'>): Promise<Meeting | null> {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting),
      })
      if (res.ok) {
        const newMeet = await res.json()
        triggerDataChange()
        return newMeet
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create meeting')
    } catch (err) {
      console.error('API createMeeting failed:', err)
      throw err
    }
  },

  async deleteMeeting(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/meetings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteMeeting failed:', err)
    }
    return false
  },

  // --- Notifications ---
  async getNotifications(role?: UserRole | 'all'): Promise<Notification[]> {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        const list = data as Notification[]
        return role ? list.filter((n) => n.target_role === 'all' || n.target_role === role) : list
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
    return []
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read_by'>): Promise<Notification | null> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      })
      if (res.ok) {
        const newNotif = await res.json()
        triggerDataChange()
        return newNotif
      }
      const err = await res.json()
      throw new Error(err.error || 'Failed to create notification')
    } catch (err) {
      console.error('API createNotification failed:', err)
      throw err
    }
  },

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API markNotificationRead failed:', err)
    }
    return false
  },

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API markAllNotificationsRead failed:', err)
    }
    return false
  },

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('API deleteNotification failed:', err)
    }
    return false
  },

  // --- Study Planner Tasks (DB-backed via /api/planner) ---
  async getStudyTasks(): Promise<any[]> {
    try {
      const res = await fetch('/api/planner')
      if (res.ok) {
        const data = await res.json()
        return data
      }
    } catch (err) {
      console.error('Failed to fetch planner tasks:', err)
    }
    return []
  },

  async createStudyTask(task: any): Promise<any> {
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (res.ok) {
        const newTask = await res.json()
        triggerDataChange()
        return newTask
      }
    } catch (err) {
      console.error('Failed to create planner task:', err)
    }
    return null
  },

  async toggleStudyTask(id: string, completed: boolean): Promise<boolean> {
    try {
      const res = await fetch('/api/planner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed }),
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('Failed to toggle study task:', err)
    }
    return false
  },

  async deleteStudyTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/planner?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        triggerDataChange()
        return true
      }
    } catch (err) {
      console.error('Failed to delete study task:', err)
    }
    return false
  },

  // --- Study Plans (Roadmaps) ---
  async getStudyPlans(studentId?: string): Promise<StudyPlan[]> {
    try {
      const tasks = await this.getStudyTasks()
      return [
        {
          id: 'plan-main',
          student_id: studentId || 'student',
          title: 'Active Study Roadmap & Tasks',
          subject_id: 'all',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          tasks: tasks.map((t: any) => ({
            id: String(t.id),
            plan_id: 'plan-main',
            title: String(t.title),
            description: t.description || null,
            completed: Boolean(t.completed),
            due_date: t.due_date || '',
            created_at: t.created_at || new Date().toISOString(),
          })),
        }
      ]
    } catch {
      return []
    }
  },

  async createStudyPlan(plan: Omit<StudyPlan, 'id' | 'created_at'>, initialTasks: string[] = []): Promise<StudyPlan> {
    for (const title of initialTasks) {
      await this.createStudyTask({
        title,
        due_date: plan.end_date,
      })
    }
    return {
      ...plan,
      id: `plan-${Date.now()}`,
      created_at: new Date().toISOString(),
      tasks: [],
    }
  },

  async addStudyPlanTask(planId: string, title: string, dueDate?: string): Promise<StudyPlanTask | null> {
    const task = await this.createStudyTask({
      title,
      due_date: dueDate || '',
    })
    if (task) {
      return {
        id: String(task.id),
        plan_id: planId,
        title: String(task.title),
        description: null,
        completed: false,
        due_date: task.due_date || '',
        created_at: task.created_at || new Date().toISOString(),
      }
    }
    return null
  },

  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    return this.toggleStudyTask(taskId, true)
  },

  async deleteStudyPlan(planId: string): Promise<boolean> {
    return true
  },
}
