'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useGrades, useSubjects, useProfiles, useExams } from '@/hooks/use-data'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, Plus, Trash2, Award } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminGradesPage() {
  const { grades, loading, refresh } = useGrades()
  const { subjects } = useSubjects()
  const { profiles: students } = useProfiles('student')
  const { exams } = useExams()

  const [openRecordDialog, setOpenRecordDialog] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [examId, setExamId] = useState<string>('none')
  const [marks, setMarks] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [semester, setSemester] = useState('1')
  const [saving, setSaving] = useState(false)

  const handleRecordGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !subjectId) {
      toast.error('Select both student and course')
      return
    }
    setSaving(true)
    try {
      await DataService.recordGrade({
        student_id: studentId,
        subject_id: subjectId,
        exam_id: examId !== 'none' ? examId : null,
        marks: parseFloat(marks) || 0,
        max_marks: parseFloat(maxMarks) || 100,
        grade: null, // auto-computed
        semester: parseInt(semester, 10) || 1,
      })
      toast.success('Grade recorded and transcript updated!')
      setOpenRecordDialog(false)
      setMarks('')
      refresh()
    } catch {
      toast.error('Failed to record grade')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGrade = async (id: string) => {
    if (confirm('Delete this grade record?')) {
      await DataService.deleteGrade(id)
      toast.success('Grade record removed')
      refresh()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gradebook & Academic Transcripts"
        description="Record examination performance, evaluate course submissions, and publish verified letter grades"
      >
        <Dialog open={openRecordDialog} onOpenChange={setOpenRecordDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Student Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleRecordGrade}>
              <DialogHeader>
                <DialogTitle>Enter Coursework / Exam Grade</DialogTitle>
                <DialogDescription>
                  Map student assessment score and compute letter grade accreditation
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gr-student">Student</Label>
                  <Select value={studentId} onValueChange={setStudentId} required>
                    <SelectTrigger id="gr-student">
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} ({s.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gr-sub">Course Subject</Label>
                    <Select value={subjectId} onValueChange={setSubjectId} required>
                      <SelectTrigger id="gr-sub">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.code} - {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gr-sem">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger id="gr-sem">
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={s.toString()}>
                            Semester {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gr-exam">Associated Exam (Optional)</Label>
                  <Select value={examId} onValueChange={setExamId}>
                    <SelectTrigger id="gr-exam">
                      <SelectValue placeholder="Select exam..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General Assessment / Continuous Evaluation</SelectItem>
                      {exams.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.title} ({e.subject?.code || 'Course'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gr-obtained">Marks Obtained</Label>
                    <Input
                      id="gr-obtained"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="e.g. 88.5"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gr-max">Max Score</Label>
                    <Input
                      id="gr-max"
                      type="number"
                      min="10"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenRecordDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Recording...' : 'Publish Grade'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Institutional Grade Records ({grades.length})</CardTitle>
          <CardDescription>Published student evaluations and letter accreditation records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No grades published yet"
              description="Enter examination marks to generate letter grades, semester transcripts, and cumulative GPAs."
            >
              <Button onClick={() => setOpenRecordDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Record First Grade
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Student Name</th>
                    <th className="py-3 px-4 font-medium">Course Code</th>
                    <th className="py-3 px-4 font-medium">Evaluation Title</th>
                    <th className="py-3 px-4 font-medium">Semester</th>
                    <th className="py-3 px-4 font-medium">Marks</th>
                    <th className="py-3 px-4 font-medium">Percentage</th>
                    <th className="py-3 px-4 font-medium text-center">Letter Grade</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grades.map((g) => {
                    const pct = Math.round((g.marks / (g.max_marks || 100)) * 100)
                    return (
                      <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          {g.student?.full_name || 'Student Candidate'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs">{g.subject?.code || '--'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {g.exam?.title || 'Course Assessment'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          Sem {g.semester}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs">
                          {g.marks} / {g.max_marks}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium">
                          {pct}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="outline" className="font-bold text-xs">
                            {g.grade || 'P'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteGrade(g.id)}
                            title="Delete Grade"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
