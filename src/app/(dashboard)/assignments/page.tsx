'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useAssignments, useSubmissions, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Clock,
  CheckCircle2,
  Award,
  UploadCloud,
  ExternalLink,
  Plus,
  Send,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate, parseDateSafe } from '@/lib/utils'
import type { Assignment } from '@/types'

export default function AssignmentsPage() {
  const { profile, role } = useUser()
  const { assignments, loading: assignmentsLoading, refresh: refreshAssignments } = useAssignments()
  const { submissions, loading: submissionsLoading, refresh: refreshSubmissions } = useSubmissions(undefined, profile?.id)
  const { subjects } = useSubjects()

  // Submission Dialog State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loading = assignmentsLoading || submissionsLoading

  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignment_id))

  // Categorize
  const pendingAssignments = assignments.filter((a) => !submittedAssignmentIds.has(a.id))
  const submittedAssignments = submissions.filter((s) => s.marks === null)
  const gradedAssignments = submissions.filter((s) => s.marks !== null)

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment || !profile) return
    setSubmitting(true)
    try {
      await DataService.submitAssignment({
        assignment_id: selectedAssignment.id,
        student_id: profile.id,
        content: submissionContent.trim() || null,
        file_url: fileUrl.trim() || null,
      })
      toast.success('Assignment submitted successfully!')
      setSelectedAssignment(null)
      setSubmissionContent('')
      setFileUrl('')
      refreshSubmissions()
    } catch {
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & Coursework"
        description="View assigned coursework, submit deliverables, and review instructor grades"
      >
        {canManage && (
          <Button asChild>
            <Link href="/admin/assignments">
              <Plus className="mr-2 h-4 w-4" />
              Manage Assignments
            </Link>
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingAssignments.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs h-5 px-1.5 py-0">
                {pendingAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({gradedAssignments.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDING ASSIGNMENTS */}
        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : pendingAssignments.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up!"
              description="You have no pending assignments right now. New coursework assigned by your instructors will appear here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingAssignments.map((a) => {
                const dueDate = parseDateSafe(a.due_date)
                const isUrgent = dueDate ? dueDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 : false

                return (
                  <Card key={a.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {a.subject?.code || 'Coursework'}
                        </Badge>
                        <Badge
                          variant={isUrgent ? 'destructive' : 'secondary'}
                          className="text-xs gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          Due {formatDate(a.due_date)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mt-2">{a.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {a.description || 'Complete the assignment instructions and submit your work before the deadline.'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <span>Course: {a.subject?.name || 'General Curriculum'}</span>
                        <span className="font-semibold text-foreground">Max Marks: {a.max_marks}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="border-t pt-3 bg-muted/20">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => setSelectedAssignment(a)}
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Submit Deliverable
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* SUBMITTED ASSIGNMENTS */}
        <TabsContent value="submitted" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : submittedAssignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Submitted Assignments"
              description="Assignments you submit will be displayed here while awaiting instructor evaluation."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submittedAssignments.map((sub) => (
                <Card key={sub.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-mono">
                        {sub.assignment?.subject?.code || 'Submitted'}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                        Under Review
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{sub.assignment?.title}</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(sub.submitted_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {sub.content && (
                      <div className="p-3 rounded-lg bg-muted/50 text-foreground">
                        <span className="font-semibold block mb-1 text-muted-foreground">Notes / Solution:</span>
                        <p className="line-clamp-3">{sub.content}</p>
                      </div>
                    )}
                    {sub.file_url && (
                      <div className="flex items-center gap-2 text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="truncate">
                          {sub.file_url}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* GRADED ASSIGNMENTS */}
        <TabsContent value="graded" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : gradedAssignments.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No Graded Assignments"
              description="Evaluated submissions with teacher marks and qualitative feedback will appear here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {gradedAssignments.map((sub) => (
                <Card key={sub.id} className="border-l-4 border-l-emerald-500 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-mono">
                        {sub.assignment?.subject?.code || 'Graded'}
                      </Badge>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {sub.marks} / {sub.assignment?.max_marks || 100}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{sub.assignment?.title}</CardTitle>
                    <CardDescription>
                      Graded on {sub.graded_at ? formatDate(sub.graded_at) : 'Recent'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {sub.feedback ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                        <span className="font-semibold block mb-1">Faculty Feedback:</span>
                        <p>{sub.feedback}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No feedback comments provided.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SUBMISSION MODAL DIALOG */}
      <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmitAssignment}>
            <DialogHeader>
              <DialogTitle>Submit Assignment Deliverable</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.title} ({selectedAssignment?.subject?.code || 'Coursework'})
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="file_url">Project / Document Link or File URL</Label>
                <Input
                  id="file_url"
                  placeholder="https://github.com/... or Google Drive link"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Provide a link to your repository, shared document, or cloud storage artifact.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content">Submission Text / Executive Summary</Label>
                <Textarea
                  id="content"
                  placeholder="Explain your approach, key findings, or solution details..."
                  rows={4}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedAssignment(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
