'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataService } from '@/lib/data-service'
import type {
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
  Profile,
  UserRole,
} from '@/types'

// Hook for Subjects
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getSubjects()
      setSubjects(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { subjects, loading, refresh }
}

// Hook for Attendance
export function useAttendance(studentId?: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getAttendance(studentId)
      setAttendance(data)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  // Computed metrics
  const totalClasses = attendance.length
  const presentCount = attendance.filter((a) => a.status === 'present').length
  const lateCount = attendance.filter((a) => a.status === 'late').length
  const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalClasses) * 100) : 0

  return { attendance, loading, refresh, totalClasses, presentCount, lateCount, attendanceRate }
}

// Hook for Assignments
export function useAssignments(subjectId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getAssignments(subjectId)
      setAssignments(data)
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { assignments, loading, refresh }
}

// Hook for Submissions
export function useSubmissions(assignmentId?: string, studentId?: string) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getSubmissions(assignmentId, studentId)
      setSubmissions(data)
    } finally {
      setLoading(false)
    }
  }, [assignmentId, studentId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { submissions, loading, refresh }
}

// Hook for Materials
export function useMaterials(subjectId?: string) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getMaterials(subjectId)
      setMaterials(data)
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { materials, loading, refresh }
}

import { parseDateSafe } from '@/lib/utils'

// Hook for Exams
export function useExams(subjectId?: string) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getExams(subjectId)
      // Sort chronologically with safe date interpretation
      data.sort((a, b) => {
        const timeA = parseDateSafe(a.date, a.start_time)?.getTime() ?? 0
        const timeB = parseDateSafe(b.date, b.start_time)?.getTime() ?? 0
        return timeA - timeB
      })
      setExams(data)
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { exams, loading, refresh }
}

// Hook for Grades
export function useGrades(studentId?: string) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getGrades(studentId)
      setGrades(data)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  // GPA calculation helper
  const totalPoints = grades.reduce((acc, g) => acc + (g.marks / (g.max_marks || 100)) * 4.0, 0)
  const gpa = grades.length > 0 ? (totalPoints / grades.length).toFixed(2) : '0.00'

  return { grades, loading, refresh, gpa }
}

// Hook for Meetings
export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getMeetings()
      data.sort((a, b) => {
        const timeA = parseDateSafe(a.date, a.time)?.getTime() ?? 0
        const timeB = parseDateSafe(b.date, b.time)?.getTime() ?? 0
        return timeA - timeB
      })
      setMeetings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { meetings, loading, refresh }
}

// Hook for Notifications
export function useNotifications(role?: UserRole | 'all') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getNotifications(role)
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { notifications, loading, refresh }
}

// Hook for Study Plans
export function useStudyPlans(studentId?: string) {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getStudyPlans(studentId)
      setPlans(data)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { plans, loading, refresh }
}

// Hook for Profiles (Students / Teachers)
export function useProfiles(role?: UserRole) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await DataService.getProfiles(role)
      setProfiles(data)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { profiles, loading, refresh }
}

// Hook for Teacher Assigned Classes and Student Roster
export function useTeacherData() {
  const [assignedClasses, setAssignedClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/students')
      if (res.ok) {
        const data = await res.json()
        setAssignedClasses(data.assigned_classes || [])
        setStudents(data.students || [])
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('studez_data_changed', refresh)
    return () => window.removeEventListener('studez_data_changed', refresh)
  }, [refresh])

  return { assignedClasses, students, loading, refresh }
}

