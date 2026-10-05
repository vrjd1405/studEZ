'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useExams, useSubjects } from '@/hooks/use-data'
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
import { GraduationCap, Plus, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { Exam } from '@/types'

export default function AdminExamsPage() {
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
      toast.error('Select an examination course')
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
      toast.success('Exam session finalized in timetable!')
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

  const handleDeleteExam = async (id: string) => {
    if (confirm('Cancel and remove this examination from the timetable?')) {
      await DataService.deleteExam(id)
      toast.success('Exam removed from schedule')
      refresh()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examination Logistics & Timetable"
        description="Schedule academic assessments, hall allocations, proctor assignments, and maximum grade bounds"
      >
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
                <DialogTitle>Schedule Examination Session</DialogTitle>
                <DialogDescription>
                  Set exam date, start and end windows, and room allocations
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-ex-title">Assessment Title</Label>
                  <Input
                    id="adm-ex-title"
                    placeholder="e.g. End-Semester Final Theory"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-ex-sub">Subject</Label>
                    <Select value={subjectId} onValueChange={setSubjectId} required>
                      <SelectTrigger id="adm-ex-sub">
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
                    <Label htmlFor="adm-ex-type">Format</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Exam['type'])}>
                      <SelectTrigger id="adm-ex-type">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm Examination</SelectItem>
                        <SelectItem value="final">Final Examination</SelectItem>
                        <SelectItem value="quiz">Assessment Quiz</SelectItem>
                        <SelectItem value="practical">Laboratory Practical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adm-ex-date">Exam Date</Label>
                  <Input
                    id="adm-ex-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-ex-start">Start Time</Label>
                    <Input
                      id="adm-ex-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-ex-end">End Time</Label>
                    <Input
                      id="adm-ex-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-ex-room">Hall / Venue</Label>
                    <Input
                      id="adm-ex-room"
                      placeholder="Hall 201"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-ex-marks">Max Marks</Label>
                    <Input
                      id="adm-ex-marks"
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
                  {saving ? 'Scheduling...' : 'Confirm Examination'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Examination Master Schedule ({exams.length})</CardTitle>
          <CardDescription>Verified academic examinations published across the institution</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No exams scheduled"
              description="Schedule examination timetables so students and invigilators receive automated calendar alerts."
            >
              <Button onClick={() => setOpenScheduleDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Schedule First Exam
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Exam Date</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Assessment Title</th>
                    <th className="py-3 px-4 font-medium">Format</th>
                    <th className="py-3 px-4 font-medium">Timing</th>
                    <th className="py-3 px-4 font-medium">Venue</th>
                    <th className="py-3 px-4 font-medium">Max Marks</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{exam.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs">{exam.subject?.code}</span>
                        <div className="text-xs text-muted-foreground">{exam.subject?.name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {exam.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="capitalize text-xs">
                          {exam.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{exam.start_time} - {exam.end_time}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{exam.room || 'Main Hall'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-xs">
                        {exam.max_marks} pts
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteExam(exam.id)}
                          title="Cancel Exam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
