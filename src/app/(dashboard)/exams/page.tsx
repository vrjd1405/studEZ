'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useExams, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
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
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Award,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Exam } from '@/types'

export default function ExamsPage() {
  const { role } = useUser()
  const { exams, loading, refresh } = useExams()
  const { subjects } = useSubjects()

  const [openScheduleDialog, setOpenScheduleDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [room, setRoom] = useState('')
  const [type, setType] = useState<Exam['type']>('midterm')
  const [maxMarks, setMaxMarks] = useState('100')
  const [saving, setSaving] = useState(false)

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId) {
      toast.error('Please select an examination subject')
      return
    }
    setSaving(true)
    try {
      await DataService.createExam({
        title: title.trim(),
        subject_id: subjectId,
        date,
        start_time: startTime,
        end_time: endTime,
        room: room.trim() || null,
        type,
        max_marks: parseInt(maxMarks, 10) || 100,
      })
      toast.success('Examination scheduled successfully!')
      setOpenScheduleDialog(false)
      setTitle('')
      setRoom('')
      refresh()
    } catch {
      toast.error('Failed to schedule exam')
    } finally {
      setSaving(false)
    }
  }

  const upcomingExams = exams.filter((e) => new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0))
  const nextExam = upcomingExams[0]

  const getDaysUntil = (examDate: string) => {
    const diff = new Date(examDate).getTime() - new Date().setHours(0, 0, 0, 0)
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days away`
  }

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examination Timetable"
        description="Official academic evaluation dates, session timings, and examination hall allocations"
      >
        {canManage && (
          <Dialog open={openScheduleDialog} onOpenChange={setOpenScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleCreateExam}>
                <DialogHeader>
                  <DialogTitle>Schedule Academic Examination</DialogTitle>
                  <DialogDescription>
                    Configure exam session, date, hall allocation, and marking weighting
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-title">Exam Title</Label>
                    <Input
                      id="e-title"
                      placeholder="e.g. Midterm Theory Examination"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="e-sub">Subject</Label>
                      <Select value={subjectId} onValueChange={setSubjectId} required>
                        <SelectTrigger id="e-sub">
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
                      <Label htmlFor="e-type">Exam Format</Label>
                      <Select value={type} onValueChange={(v) => setType(v as Exam['type'])}>
                        <SelectTrigger id="e-type">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="midterm">Midterm</SelectItem>
                          <SelectItem value="final">Final Exam</SelectItem>
                          <SelectItem value="quiz">Quiz / Assessment</SelectItem>
                          <SelectItem value="practical">Practical / Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="e-date">Exam Date</Label>
                    <Input
                      id="e-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="e-start">Start Time</Label>
                      <Input
                        id="e-start"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="e-end">End Time</Label>
                      <Input
                        id="e-end"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="e-room">Room / Hall</Label>
                      <Input
                        id="e-room"
                        placeholder="e.g. Hall 401"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="e-marks">Max Marks</Label>
                      <Input
                        id="e-marks"
                        type="number"
                        min="10"
                        max="200"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Scheduling...' : 'Save Examination'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Hero Next Exam Countdown Banner */}
      {nextExam && (
        <Card className="bg-gradient-to-r from-purple-500/10 via-card to-card border-purple-500/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white font-medium text-xs">
                      Next Scheduled Exam
                    </Badge>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {getDaysUntil(nextExam.date)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mt-1">{nextExam.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nextExam.subject?.name} ({nextExam.subject?.code}) • Hall: {nextExam.room || 'Main Auditorium'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium self-end md:self-center">
                <div className="text-right">
                  <div className="text-base font-bold">{nextExam.date}</div>
                  <div className="text-xs text-muted-foreground">{nextExam.start_time} - {nextExam.end_time}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No examinations scheduled"
          description="Examination schedules, midterms, and finals will appear here once finalized by the controller of examinations."
        >
          {canManage && (
            <Button onClick={() => setOpenScheduleDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Schedule First Exam
            </Button>
          )}
        </EmptyState>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Full Timetable</CardTitle>
            <CardDescription>Chronological list of all academic testing sessions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">Exam Date</th>
                    <th className="py-3.5 px-4 font-medium">Subject</th>
                    <th className="py-3.5 px-4 font-medium">Title & Format</th>
                    <th className="py-3.5 px-4 font-medium">Time Window</th>
                    <th className="py-3.5 px-4 font-medium">Hall / Room</th>
                    <th className="py-3.5 px-4 font-medium text-right">Max Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{exam.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-foreground">{exam.subject?.name || 'Curriculum Course'}</div>
                        <span className="font-mono text-xs text-muted-foreground">{exam.subject?.code || '--'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{exam.title}</div>
                        <Badge variant="outline" className="capitalize text-[11px] mt-0.5">
                          {exam.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{exam.start_time} - {exam.end_time}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{exam.room || 'Auditorium'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold">
                        {exam.max_marks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
