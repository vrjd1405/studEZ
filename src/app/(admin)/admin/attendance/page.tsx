'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useSubjects, useProfiles, useAttendance } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarCheck, Save, CheckCircle2, Clock, XCircle, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { Attendance } from '@/types'

export default function AdminAttendancePage() {
  const { profile } = useUser()
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { profiles: students, loading: studentsLoading } = useProfiles('student')
  const { attendance, refresh: refreshAttendance } = useAttendance()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, Attendance['status']>>({})
  const [saving, setSaving] = useState(false)

  // Auto-select first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  // Initialize or populate student status
  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<string, Attendance['status']> = {}
      students.forEach((s) => {
        // Check if existing record exists for this date and subject
        const existing = attendance.find(
          (a) => a.student_id === s.id && a.subject_id === selectedSubjectId && a.date === attendanceDate
        )
        initial[s.id] = existing ? existing.status : 'present'
      })
      setStudentStatusMap(initial)
    }
  }, [students, selectedSubjectId, attendanceDate, attendance])

  const setStatusForStudent = (studentId: string, status: Attendance['status']) => {
    setStudentStatusMap((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    const updated: Record<string, Attendance['status']> = {}
    students.forEach((s) => {
      updated[s.id] = 'present'
    })
    setStudentStatusMap(updated)
    toast.info('Marked all students as Present')
  }

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId || !profile) {
      toast.error('Select an active subject')
      return
    }
    setSaving(true)
    try {
      const recordsToSave = students.map((s) => ({
        student_id: s.id,
        subject_id: selectedSubjectId,
        date: attendanceDate,
        status: studentStatusMap[s.id] || 'present',
        marked_by: profile.id,
      }))

      await DataService.bulkRecordAttendance(recordsToSave)
      toast.success(`Attendance successfully logged for ${attendanceDate}!`)
      refreshAttendance()
    } catch {
      toast.error('Failed to log attendance')
    } finally {
      setSaving(false)
    }
  }

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Attendance Register"
        description="Record lecture roll calls, mark punctuality, and audit official attendance sheets"
      />

      {/* Control Bar: Select Course & Date */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
            <div className="space-y-1.5">
              <Label>Active Academic Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Session Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-1" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button className="flex-1" onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Register'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Roll Call */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Student Roll Call: {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Select Course'}
              </CardTitle>
              <CardDescription>
                Session Date: {attendanceDate} &bull; Total Students in Cohort: {students.length}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {studentsLoading || subjectsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading roster...</div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students available"
              description="Enroll students into the system to begin recording roll call attendance registers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Student</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Cohort</th>
                    <th className="py-3 px-4 font-medium text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => {
                    const currentStatus = studentStatusMap[student.id] || 'present'
                    return (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar_url || ''} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                {getInitials(student.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">{student.full_name}</div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {student.department || 'General'}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          Year {student.year || 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === 'present' ? 'default' : 'outline'}
                              className={`h-8 px-3 text-xs gap-1.5 ${
                                currentStatus === 'present' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                              }`}
                              onClick={() => setStatusForStudent(student.id, 'present')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Present
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === 'late' ? 'default' : 'outline'}
                              className={`h-8 px-3 text-xs gap-1.5 ${
                                currentStatus === 'late' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
                              }`}
                              onClick={() => setStatusForStudent(student.id, 'late')}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Late
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === 'absent' ? 'default' : 'outline'}
                              className={`h-8 px-3 text-xs gap-1.5 ${
                                currentStatus === 'absent' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                              }`}
                              onClick={() => setStatusForStudent(student.id, 'absent')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Absent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save & Publish Register'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
