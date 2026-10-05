'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useMeetings } from '@/hooks/use-data'
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
import { Video, Plus, Trash2, Calendar, Clock, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Meeting } from '@/types'

export default function AdminMeetingsPage() {
  const { profile } = useUser()
  const { meetings, loading, refresh } = useMeetings()

  const [openScheduleDialog, setOpenScheduleDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [link, setLink] = useState('')
  const [type, setType] = useState<Meeting['type']>('class')
  const [saving, setSaving] = useState(false)

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      await DataService.createMeeting({
        title: title.trim(),
        description: description.trim() || null,
        date,
        time,
        end_time: endTime || null,
        link: link.trim() || null,
        type,
        created_by: profile.id,
      })
      toast.success('Virtual session scheduled!')
      setOpenScheduleDialog(false)
      setTitle('')
      setDescription('')
      setLink('')
      refresh()
    } catch {
      toast.error('Failed to schedule session')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    if (confirm('Cancel and remove this virtual session?')) {
      await DataService.deleteMeeting(id)
      toast.success('Session cancelled')
      refresh()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Lectures & Meeting Management"
        description="Schedule virtual classrooms, faculty office hours, webinars, and institutional seminars"
      >
        <Dialog open={openScheduleDialog} onOpenChange={setOpenScheduleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateMeeting}>
              <DialogHeader>
                <DialogTitle>Schedule Virtual Session</DialogTitle>
                <DialogDescription>
                  Configure video conferencing link, date, timings, and attendee type
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-meet-title">Session Name</Label>
                  <Input
                    id="adm-meet-title"
                    placeholder="e.g. Computer Science Orientation & Lecture 1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-meet-type">Session Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Meeting['type'])}>
                      <SelectTrigger id="adm-meet-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Virtual Class</SelectItem>
                        <SelectItem value="office_hours">Office Hours</SelectItem>
                        <SelectItem value="event">Campus Seminar</SelectItem>
                        <SelectItem value="other">Discussion Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adm-meet-date">Date</Label>
                    <Input
                      id="adm-meet-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-meet-start">Start Time</Label>
                    <Input
                      id="adm-meet-start"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-meet-end">End Time</Label>
                    <Input
                      id="adm-meet-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adm-meet-link">Video Call Link</Label>
                  <Input
                    id="adm-meet-link"
                    placeholder="https://meet.google.com/... or Zoom Link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adm-meet-desc">Agenda Notes</Label>
                  <Input
                    id="adm-meet-desc"
                    placeholder="Short agenda or discussion topics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Scheduling...' : 'Save Session'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Institutional Sessions ({meetings.length})</CardTitle>
          <CardDescription>All authorized live sessions with direct conference links</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No active sessions"
              description="Schedule live classes, webinars, or mentoring office hours for students and staff."
            >
              <Button onClick={() => setOpenScheduleDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Schedule First Session
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Session Title</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Timing</th>
                    <th className="py-3 px-4 font-medium">Video Link</th>
                    <th className="py-3 px-4 font-medium">Host</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {meetings.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div>{m.title}</div>
                        {m.description && <div className="text-xs text-muted-foreground line-clamp-1">{m.description}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="capitalize text-xs">
                          {m.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{m.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{m.time} {m.end_time ? `- ${m.end_time}` : ''}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {m.link ? (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline max-w-[180px] truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{m.link}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">In-Person</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {m.creator?.full_name || 'Admin'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMeeting(m.id)}
                          title="Delete Session"
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
