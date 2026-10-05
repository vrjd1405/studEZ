'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useNotifications } from '@/hooks/use-data'
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
import { Bell, Plus, Send, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Notification } from '@/types'

export default function AdminNotificationsPage() {
  const { profile } = useUser()
  const { notifications, loading, refresh } = useNotifications('all')

  const [openBroadcastDialog, setOpenBroadcastDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<Notification['type']>('info')
  const [targetRole, setTargetRole] = useState<Notification['target_role']>('all')
  const [broadcasting, setBroadcasting] = useState(false)

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setBroadcasting(true)
    try {
      await DataService.createNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        target_role: targetRole,
        created_by: profile.id,
      })
      toast.success('Campus announcement broadcasted successfully!')
      setOpenBroadcastDialog(false)
      setTitle('')
      setMessage('')
      refresh()
    } catch {
      toast.error('Failed to broadcast notification')
    } finally {
      setBroadcasting(false)
    }
  }

  const getTypeBadge = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return (
          <Badge variant="outline" className="gap-1 text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
            <AlertTriangle className="h-3 w-3" /> Warning
          </Badge>
        )
      case 'success':
        return (
          <Badge variant="outline" className="gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Notice
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="outline" className="gap-1 text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300">
            <XCircle className="h-3 w-3" /> Urgent
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300">
            <Info className="h-3 w-3" /> General
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Broadcasts & Announcements"
        description="Dispatch institutional circulars, academic notices, and urgent alerts across all cohorts"
      >
        <Dialog open={openBroadcastDialog} onOpenChange={setOpenBroadcastDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Broadcast Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleBroadcast}>
              <DialogHeader>
                <DialogTitle>Broadcast Institutional Notice</DialogTitle>
                <DialogDescription>
                  This announcement will appear immediately on the topbar and notifications feed
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="notif-title">Announcement Headline</Label>
                  <Input
                    id="notif-title"
                    placeholder="e.g. End-Semester Registration Deadline Extended"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="notif-aud">Target Audience</Label>
                    <Select value={targetRole} onValueChange={(v) => setTargetRole(v as Notification['target_role'])}>
                      <SelectTrigger id="notif-aud">
                        <SelectValue placeholder="Audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone (All Campus)</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                        <SelectItem value="teacher">Faculty / Teachers</SelectItem>
                        <SelectItem value="admin">Administrators</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notif-type">Severity Level</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Notification['type'])}>
                      <SelectTrigger id="notif-type">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">General Info</SelectItem>
                        <SelectItem value="warning">Important Warning</SelectItem>
                        <SelectItem value="success">Academic Success / Event</SelectItem>
                        <SelectItem value="error">Urgent Action Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notif-msg">Notice Body</Label>
                  <Textarea
                    id="notif-msg"
                    placeholder="Provide full context, instructions, or official guidelines..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenBroadcastDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={broadcasting}>
                  <Send className="mr-2 h-4 w-4" />
                  {broadcasting ? 'Broadcasting...' : 'Publish Announcement'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Broadcast History ({notifications.length})</CardTitle>
          <CardDescription>Archive of institutional circulars and read engagement receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No broadcast notices published"
              description="Dispatch announcements to keep students and faculty informed of critical campus updates."
            >
              <Button onClick={() => setOpenBroadcastDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Broadcast First Notice
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Headline & Message</th>
                    <th className="py-3 px-4 font-medium">Severity</th>
                    <th className="py-3 px-4 font-medium">Target Audience</th>
                    <th className="py-3 px-4 font-medium">Published At</th>
                    <th className="py-3 px-4 font-medium text-right">Read Receipts</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notifications.map((notif) => (
                    <tr key={notif.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-foreground">{notif.title}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(notif.type)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {notif.target_role === 'all' ? 'Entire Campus' : notif.target_role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-right whitespace-nowrap">
                        <span className="font-semibold">{notif.read_by?.length || 0}</span> recipients
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
