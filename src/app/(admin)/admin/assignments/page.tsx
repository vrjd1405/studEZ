'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useAssignments, useSubmissions, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { FileText, Plus, Trash2, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Assignment, AssignmentSubmission } from '@/types'

export default function AdminAssignmentsPage() {
  const { profile } = useUser()
  const { assignments, loading: assignmentsLoading, refresh: refreshAssignments } = useAssignments()
  const { submissions, refresh: refreshSubmissions } = useSubmissions()
  const { subjects } = useSubjects()

  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openSubmissionsDialog, setOpenSubmissionsDialog] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null)

  // New Assignment form state
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Grading form state
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null)
  const [gradeMarks, setGradeMarks] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [savingGrade, setSavingGrade] = useState(false)

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !profile) {
      toast.error('Select an active subject')
      return
    }
    setSaving(true)
    try {
      await DataService.createAssignment({
        title: title.trim(),
        subject_id: subjectId,
        due_date: new Date(dueDate).toISOString(),
        max_marks: parseInt(maxMarks, 10) || 100,
        description: description.trim() || null,
        created_by: profile.id,
      })
      toast.success('Assignment published to students!')
      setOpenCreateDialog(false)
      setTitle('')
      setDescription('')
      refreshAssignments()
    } catch {
      toast.error('Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Delete this assignment? Submissions will also be removed.')) {
      await DataService.deleteAssignment(id)
      toast.success('Assignment deleted')
      refreshAssignments()
    }
  }

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingSubmission) return
    setSavingGrade(true)
    try {
      await DataService.gradeSubmission(
        gradingSubmission.id,
        parseInt(gradeMarks, 10) || 0,
        gradeFeedback.trim()
      )
      toast.success('Submission graded and published!')
      setGradingSubmission(null)
      refreshSubmissions()
    } catch {
      toast.error('Failed to save grade')
    } finally {
      setSavingGrade(false)
    }
  }

  const assignmentSubmissions = activeAssignment
    ? submissions.filter((s) => s.assignment_id === activeAssignment.id)
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignment & Deliverables Management"
        description="Publish student coursework, set marking rubrics, inspect deliverables, and evaluate grades"
      >
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateAssignment}>
              <DialogHeader>
                <DialogTitle>Publish New Assignment</DialogTitle>
                <DialogDescription>
                  Define coursework title, subject, deadline, and total score weighting
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="as-title">Assignment Title</Label>
                  <Input
                    id="as-title"
                    placeholder="e.g. Lab Project: Red-Black Tree Implementation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="as-sub">Subject</Label>
                    <Select value={subjectId} onValueChange={setSubjectId} required>
                      <SelectTrigger id="as-sub">
                        <SelectValue placeholder="Select course" />
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
                    <Label htmlFor="as-marks">Max Marks</Label>
                    <Input
                      id="as-marks"
                      type="number"
                      min="10"
                      max="200"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="as-due">Submission Due Date</Label>
                  <Input
                    id="as-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="as-desc">Assignment Instructions</Label>
                  <Textarea
                    id="as-desc"
                    placeholder="Provide detailed instructions, submission guidelines, or rubrics..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Publishing...' : 'Publish Coursework'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Active Institutional Coursework ({assignments.length})</CardTitle>
          <CardDescription>Track submission counts and review student solutions</CardDescription>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments created"
              description="Publish assignments so students can submit code, reports, and coursework deliverables."
            >
              <Button onClick={() => setOpenCreateDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Assignment
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Assignment Title</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Due Date</th>
                    <th className="py-3 px-4 font-medium">Max Marks</th>
                    <th className="py-3 px-4 font-medium">Submissions</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((a) => {
                    const subs = submissions.filter((s) => s.assignment_id === a.id)
                    const gradedCount = subs.filter((s) => s.marks !== null).length

                    return (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{a.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{a.description || 'No instructions'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs">{a.subject?.code}</span>
                          <div className="text-xs text-muted-foreground">{a.subject?.name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {new Date(a.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs">
                          {a.max_marks} pts
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs font-medium"
                            onClick={() => {
                              setActiveAssignment(a)
                              setOpenSubmissionsDialog(true)
                            }}
                          >
                            {subs.length} Received ({gradedCount} Graded)
                          </Button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAssignment(a.id)}
                            title="Delete Assignment"
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

      {/* SUBMISSIONS MODAL & GRADING DESK */}
      <Dialog open={openSubmissionsDialog} onOpenChange={setOpenSubmissionsDialog}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions Review Desk</DialogTitle>
            <DialogDescription>
              {activeAssignment?.title} &bull; Max Marks: {activeAssignment?.max_marks}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {assignmentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No students have submitted this assignment yet.
              </p>
            ) : (
              <div className="divide-y">
                {assignmentSubmissions.map((sub) => (
                  <div key={sub.id} className="py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {sub.student?.full_name || sub.student_name || 'Enrolled Student'} ({sub.student?.email || sub.student_email || 'Enrolled'})
                      </span>
                      {sub.marks !== null ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Graded: {sub.marks} / {activeAssignment?.max_marks}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                          Awaiting Grade
                        </Badge>
                      )}
                    </div>

                    {sub.content && (
                      <p className="text-xs bg-muted/40 p-2.5 rounded-lg text-foreground whitespace-pre-wrap">
                        {sub.content}
                      </p>
                    )}

                    {sub.file_url && (
                      <div className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer">
                          {sub.file_url}
                        </a>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => {
                          setGradingSubmission(sub)
                          setGradeMarks(sub.marks ? sub.marks.toString() : '')
                          setGradeFeedback(sub.feedback || '')
                        }}
                      >
                        {sub.marks !== null ? 'Update Grade' : 'Grade Submission'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* GRADE INPUT DIALOG */}
      <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleGradeSubmission}>
            <DialogHeader>
              <DialogTitle>Evaluate Submission</DialogTitle>
              <DialogDescription>
                Assign score out of {activeAssignment?.max_marks} and provide feedback
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="gr-marks">Awarded Marks</Label>
                <Input
                  id="gr-marks"
                  type="number"
                  min="0"
                  max={activeAssignment?.max_marks || 100}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gr-feed">Instructor Feedback</Label>
                <Textarea
                  id="gr-feed"
                  placeholder="Constructive feedback or remarks for the student..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradingSubmission(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingGrade}>
                {savingGrade ? 'Saving...' : 'Submit Grade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
