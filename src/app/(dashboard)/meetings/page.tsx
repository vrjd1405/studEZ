'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useMeetings } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Video, Plus, Calendar, Clock, User, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Meeting } from '@/types'

export default function MeetingsPage() {
  const { profile, role } = useUser()
  const { meetings, loading, refresh } = useMeetings()

  const [selectedType, setSelectedType] = useState<string>('all')
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false)

  // Form states
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
      toast.success('Meeting scheduled successfully!')
      setOpenScheduleDialog(false)
      setTitle('')
      setDescription('')
      setLink('')
      refresh()
    } catch {
      toast.error('Failed to schedule meeting')
    } finally {
      setSaving(false)
    }
  }

  const filteredMeetings = selectedType === 'all'
    ? meetings
    : meetings.filter((m) => m.type === selectedType)

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Virtual Classes & Meetings"
        description="Join online lectures, faculty office hours, mentoring sessions, and academic webinars"
      >
        {canManage && (
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
                  <DialogTitle>Schedule Live Session</DialogTitle>
                  <DialogDescription>
                    Create a virtual class, office hours consultation, or department event
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="meet-title">Session Title</Label>
                    <Input
                      id="meet-title"
                      placeholder="e.g. Algorithms Doubt Clearing & Office Hours"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="meet-type">Session Type</Label>
                      <Select value={type} onValueChange={(v) => setType(v as Meeting['type'])}>
                        <SelectTrigger id="meet-type">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="class">Live Class</SelectItem>
                          <SelectItem value="office_hours">Office Hours</SelectItem>
                          <SelectItem value="event">Campus Event</SelectItem>
                          <SelectItem value="other">Discussion / Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="meet-date">Date</Label>
                      <Input
                        id="meet-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="meet-start">Start Time</Label>
                      <Input
                        id="meet-start"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="meet-end">End Time</Label>
                      <Input
                        id="meet-end"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meet-link">Virtual Meeting URL</Label>
                    <Input
                      id="meet-link"
                      placeholder="https://meet.google.com/... or Zoom URL"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="meet-desc">Agenda / Description</Label>
                    <Input
                      id="meet-desc"
                      placeholder="Topics to discuss or prerequisites..."
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
                    {saving ? 'Scheduling...' : 'Confirm Schedule'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Filter Row */}
      <div className="flex items-center gap-2">
        {['all', 'class', 'office_hours', 'event'].map((t) => (
          <Button
            key={t}
            variant={selectedType === t ? 'default' : 'outline'}
            size="sm"
            className="capitalize text-xs h-8"
            onClick={() => setSelectedType(t)}
          >
            {t === 'all' ? 'All Sessions' : t.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No sessions scheduled"
          description="Live classes, office hours, and faculty meetings will appear here with instant join links."
        >
          {canManage && (
            <Button onClick={() => setOpenScheduleDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Schedule First Session
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMeetings.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize text-xs">
                    {m.type.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{m.date}</span>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 line-clamp-1">{m.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {m.description || 'Live virtual interactive session with instructor.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground pt-0">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{m.time} {m.end_time ? `- ${m.end_time}` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Host: {m.creator?.full_name || 'Faculty Instructor'}</span>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3">
                {m.link ? (
                  <Button size="sm" className="w-full gap-2 text-xs" asChild>
                    <a href={m.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join Video Call
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full text-xs" disabled>
                    In-Person Session
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
