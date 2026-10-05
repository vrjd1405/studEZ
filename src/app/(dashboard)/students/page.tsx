'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  BookOpen,
  CalendarCheck,
  Award,
  FileText,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  GraduationCap,
} from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import Link from 'next/link'

interface AssignedClass {
  class_id: string
  teacher_id: string
  subject_id: string
  subject_code: string
  subject_name: string
  credits: number
  department: string
  year: string
  semester: number
  section: string
}

interface StudentCourseRecord {
  id: string
  student_id: string
  full_name: string
  email: string
  register_number: string
  department: string
  year: string
  semester: number
  section: string
  phone: string | null
  status: string
  class_id: string
  subject_id: string
  subject_code: string
  subject_name: string
  course_credits: number
  attendance_percentage: number
  attended_classes: number
  total_classes: number
  last_attendance: string | null
  total_assignments: number
  submitted_assignments: number
  pending_assignments: number
  internal_marks: number | null
  max_marks: number
  grade_letter: string | null
  remarks: string
  last_updated: string | null
}

export default function TeacherStudentsPage() {
  const { profile, role, loading: userLoading } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && profile && role !== 'teacher' && role !== 'admin') {
      toast.error('Access restricted to faculty and teachers only.')
      router.replace('/dashboard')
    }
  }, [userLoading, profile, role, router])

  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [students, setStudents] = useState<StudentCourseRecord[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit record dialog state
  const [editingStudent, setEditingStudent] = useState<StudentCourseRecord | null>(null)
  const [editMarks, setEditMarks] = useState<string>('')
  const [editGrade, setEditGrade] = useState<string>('A')
  const [editRemarks, setEditRemarks] = useState<string>('')
  const [savingRecord, setSavingRecord] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/students')
      if (res.ok) {
        const data = await res.json()
        setAssignedClasses(data.assigned_classes || [])
        setStudents(data.students || [])
      } else {
        toast.error('Failed to load student course records')
      }
    } catch {
      toast.error('Error connecting to student records service')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((record) => {
      // Filter by selected course/class
      if (selectedClassId !== 'all') {
        const targetClass = assignedClasses.find((c) => c.class_id === selectedClassId)
        if (targetClass && record.subject_id !== targetClass.subject_id) return false
        if (targetClass && record.section !== targetClass.section) return false
      }

      // Filter by section
      if (selectedSection !== 'all' && record.section !== selectedSection) {
        return false
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = record.full_name.toLowerCase().includes(q)
        const matchEmail = record.email.toLowerCase().includes(q)
        const matchReg = record.register_number.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchReg) return false
      }

      return true
    })
  }, [students, selectedClassId, selectedSection, searchQuery, assignedClasses])

  // Aggregate stats for current view
  const stats = useMemo(() => {
    const totalCount = filteredStudents.length
    if (totalCount === 0) {
      return { total: 0, avgAttendance: 0, avgMarks: 0, submissionRate: 0 }
    }
    const sumAtt = filteredStudents.reduce((acc, s) => acc + s.attendance_percentage, 0)
    const evaluatedList = filteredStudents.filter((s) => s.internal_marks !== null)
    const sumMarks = evaluatedList.reduce((acc, s) => acc + (s.internal_marks || 0), 0)
    const sumSub = filteredStudents.reduce(
      (acc, s) => acc + (s.total_assignments > 0 ? (s.submitted_assignments / s.total_assignments) * 100 : 100),
      0
    )

    return {
      total: totalCount,
      avgAttendance: Math.round(sumAtt / totalCount),
      avgMarks: evaluatedList.length > 0 ? Math.round(sumMarks / evaluatedList.length) : 0,
      submissionRate: Math.round(sumSub / totalCount),
    }
  }, [filteredStudents])

  // Open edit dialog
  const handleOpenEdit = (record: StudentCourseRecord) => {
    setEditingStudent(record)
    setEditMarks(record.internal_marks !== null ? String(record.internal_marks) : '')
    setEditGrade(record.grade_letter || 'A')
    setEditRemarks(record.remarks || '')
  }

  // Save record changes
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    setSavingRecord(true)
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: editingStudent.student_id,
          subject_id: editingStudent.subject_id,
          section: editingStudent.section,
          internal_marks: editMarks.trim() !== '' ? Number(editMarks) : null,
          max_marks: 100,
          grade_letter: editGrade,
          remarks: editRemarks,
        }),
      })

      if (res.ok) {
        toast.success(`Academic records updated for ${editingStudent.full_name}`)
        setEditingStudent(null)
        // Refresh local data
        fetchRecords()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update record')
      }
    } catch {
      toast.error('Network error updating student record')
    } finally {
      setSavingRecord(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Course Students & Academic Records"
        description="Exclusive record management for students under your assigned courses, subjects, and class sections."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecords}
            disabled={loading}
            className="gap-1.5 h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Roster
          </Button>
          <Button size="sm" asChild className="gap-1.5 h-8 text-xs font-semibold">
            <Link href="/attendance">
              <CalendarCheck className="h-3.5 w-3.5" />
              Mark Class Attendance
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Under your assigned courses & sections
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Average Attendance
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Class session attendance average
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Internal Evaluation
            </CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgMarks > 0 ? `${stats.avgMarks}/100` : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average internal continuous marks
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assigned Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedClasses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active subject & section allocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roster Filters & Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student name, roll no, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Course Filter */}
            <div>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Assigned Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Assigned Teaching Courses ({assignedClasses.length})
                  </SelectItem>
                  {assignedClasses.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id} className="text-xs">
                      {cls.subject_code} - {cls.subject_name} (Sec {cls.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Filter */}
            <div>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Sections</SelectItem>
                  <SelectItem value="A" className="text-xs">Section A</SelectItem>
                  <SelectItem value="B" className="text-xs">Section B</SelectItem>
                  <SelectItem value="C" className="text-xs">Section C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Roster Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Student Academic Records ({filteredStudents.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Students strictly enrolled in your assigned curriculum with live attendance and internal marks
              </CardDescription>
            </div>
            {assignedClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignedClasses.map((cls) => (
                  <Badge key={cls.class_id} variant="outline" className="text-[11px] font-normal">
                    {cls.subject_code} • Sec {cls.section}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mb-2 text-primary" />
              <p className="text-sm font-medium">Loading course student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-muted/60 p-4 mb-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base">No students found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {assignedClasses.length === 0
                  ? 'You have not yet been assigned to any course or section. Please contact your administrator to allocate teaching subjects.'
                  : 'No student records match your selected course or search filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Course & Class</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Assignments</th>
                    <th className="py-3 px-4">Internal Marks</th>
                    <th className="py-3 px-4">Teacher Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStudents.map((record) => {
                    const attRate = record.attendance_percentage
                    const attColor =
                      attRate >= 75
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : attRate >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'

                    return (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        {/* Student Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-foreground">
                            {record.full_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[10px]">
                              {record.register_number}
                            </span>
                            <span>•</span>
                            <span>{record.email}</span>
                          </div>
                        </td>

                        {/* Course & Class */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-xs text-foreground">
                            {record.subject_code}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {record.department} • Sec {record.section}
                          </div>
                        </td>

                        {/* Attendance */}
                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-bold ${attColor}`}>{attRate}%</span>
                            <span className="text-[10px] text-muted-foreground">
                              {record.attended_classes}/{record.total_classes || record.attended_classes} sessions
                            </span>
                          </div>
                          <Progress value={attRate} className="h-1.5" />
                        </td>

                        {/* Assignments */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium">
                            {record.submitted_assignments} / {record.total_assignments} submitted
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {record.pending_assignments > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {record.pending_assignments} pending
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                All submitted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Internal Marks */}
                        <td className="py-3.5 px-4">
                          {record.internal_marks !== null ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="font-bold text-xs">
                                {record.internal_marks} / {record.max_marks}
                              </Badge>
                              {record.grade_letter && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {record.grade_letter}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              Not evaluated yet
                            </span>
                          )}
                        </td>

                        {/* Teacher Remarks */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          {record.remarks ? (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {record.remarks}
                            </p>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px] italic">
                              No remarks added
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(record)}
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-primary" />
                            Record Marks
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Marks & Remarks Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-md">
          {editingStudent && (
            <form onSubmit={handleSaveRecord} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Evaluate Student Academic Record
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Recording marks for{' '}
                  <strong className="text-foreground">{editingStudent.full_name}</strong> in{' '}
                  <strong className="text-foreground">
                    {editingStudent.subject_code} - {editingStudent.subject_name} (Section {editingStudent.section})
                  </strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Internal Continuous Marks */}
                  <div className="space-y-1.5">
                    <Label htmlFor="marks" className="text-xs font-semibold">
                      Internal Marks (out of 100)
                    </Label>
                    <Input
                      id="marks"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 88"
                      value={editMarks}
                      onChange={(e) => setEditMarks(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  {/* Letter Grade */}
                  <div className="space-y-1.5">
                    <Label htmlFor="grade" className="text-xs font-semibold">
                      Course Grade
                    </Label>
                    <Select value={editGrade} onValueChange={setEditGrade}>
                      <SelectTrigger id="grade" className="h-9 text-xs">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+" className="text-xs font-medium">A+ (Outstanding)</SelectItem>
                        <SelectItem value="A" className="text-xs font-medium">A (Excellent)</SelectItem>
                        <SelectItem value="B+" className="text-xs font-medium">B+ (Very Good)</SelectItem>
                        <SelectItem value="B" className="text-xs font-medium">B (Good)</SelectItem>
                        <SelectItem value="C+" className="text-xs font-medium">C+ (Above Average)</SelectItem>
                        <SelectItem value="C" className="text-xs font-medium">C (Average)</SelectItem>
                        <SelectItem value="D" className="text-xs font-medium">D (Pass)</SelectItem>
                        <SelectItem value="F" className="text-xs font-medium text-red-600">F (Fail)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Qualitative Academic Remarks */}
                <div className="space-y-1.5">
                  <Label htmlFor="remarks" className="text-xs font-semibold">
                    Teacher Remarks & Academic Notes
                  </Label>
                  <Textarea
                    id="remarks"
                    rows={3}
                    placeholder="Enter observations on student performance, lab conduct, or areas to improve..."
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>

                {/* Summary badges */}
                <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Course Attendance:</span>
                    <strong className="text-foreground">{editingStudent.attendance_percentage}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignments Submitted:</span>
                    <strong className="text-foreground">
                      {editingStudent.submitted_assignments} of {editingStudent.total_assignments}
                    </strong>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingRecord}>
                  {savingRecord ? 'Saving...' : 'Save Academic Record'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
