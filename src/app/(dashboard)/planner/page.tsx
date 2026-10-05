'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  CalendarDays,
  Plus,
  Target,
  Clock,
  CheckCircle2,
  Trash2,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  Bot,
  AlertCircle,
  Flag,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface StudyTask {
  id: string
  student_id: string
  subject_id: string | null
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  duration_minutes: number
  completed: boolean
  created_at: string
  subject?: {
    id: string
    name: string
    code: string
  }
}

export default function PlannerPage() {
  const { profile, role, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!userLoading && profile && role !== 'student') {
      toast.error('The Study Planner is exclusively for students.')
      router.replace('/dashboard')
    }
  }, [userLoading, profile, role, router])

  const { subjects } = useSubjects()
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskSubjectId, setTaskSubjectId] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [taskDuration, setTaskDuration] = useState('60')
  const [submitting, setSubmitting] = useState(false)

  // Fetch tasks from database
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/planner')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch {
      toast.error('Failed to load study tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    window.addEventListener('studez_data_changed', loadTasks)
    return () => window.removeEventListener('studez_data_changed', loadTasks)
  }, [loadTasks])

  // Toggle completion
  const handleToggleTask = async (task: StudyTask) => {
    const updatedStatus = !task.completed
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: updatedStatus } : t))
    )

    try {
      const res = await fetch('/api/planner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, completed: updatedStatus }),
      })
      if (res.ok) {
        toast.success(updatedStatus ? 'Task completed! Great job.' : 'Task marked pending.')
      } else {
        loadTasks()
      }
    } catch {
      loadTasks()
    }
  }

  // Delete task
  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/planner?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id))
        toast.success('Task removed from planner')
      }
    } catch {
      toast.error('Failed to delete task')
    }
  }

  // Create new task manually
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          subject_id: taskSubjectId || null,
          priority: taskPriority,
          due_date: taskDueDate || null,
          duration_minutes: Number(taskDuration) || 60,
        }),
      })

      if (res.ok) {
        toast.success('Study task scheduled!')
        setOpenNewTaskDialog(false)
        setTaskTitle('')
        setTaskDueDate('')
        setTaskPriority('medium')
        loadTasks()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create task')
      }
    } catch {
      toast.error('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const pendingCount = tasks.length - completedCount
  const highPriorityCount = tasks.filter((t) => t.priority === 'high' && !t.completed).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Study Planner"
        description="Daily syllabus revision tasks, AI-scheduled study blocks, and exam milestone tracking"
      >
        <div className="flex items-center gap-2">
          <Link href="/ai">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ask AI to Schedule Task
            </Button>
          </Link>

          <Dialog open={openNewTaskDialog} onOpenChange={setOpenNewTaskDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Add Study Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Schedule Study Task</DialogTitle>
                  <DialogDescription className="text-xs">
                    Create a targeted revision goal with subject, priority, and target duration.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="task-title" className="text-xs">Task Title</Label>
                    <Input
                      id="task-title"
                      placeholder="e.g. Solve Dynamic Programming LeetCode Set"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="task-subject" className="text-xs">Subject (Optional)</Label>
                    <Select value={taskSubjectId} onValueChange={setTaskSubjectId}>
                      <SelectTrigger id="task-subject">
                        <SelectValue placeholder="General / All Subjects" />
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="task-priority" className="text-xs">Priority</Label>
                      <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
                        <SelectTrigger id="task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="task-duration" className="text-xs">Estimated Minutes</Label>
                      <Input
                        id="task-duration"
                        type="number"
                        min="10"
                        step="5"
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(e.target.value)}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="task-due" className="text-xs">Target Date & Time</Label>
                    <Input
                      id="task-due"
                      type="datetime-local"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewTaskDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? 'Scheduling...' : 'Save Task to Planner'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-xs border border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Study goals awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{highPriorityCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Requires immediate revision focus</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Checked off across all subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card className="shadow-sm border border-border/80">
        <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Daily & Weekly Study Tasks</CardTitle>
            <CardDescription className="text-xs">
              Directly connected to SQLite relational storage and AI Study Assistant
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {tasks.length} Total Task{tasks.length === 1 ? '' : 's'}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">No study tasks scheduled yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Schedule your daily study milestones or ask the AI Study Assistant to automatically propose and create revision tasks for you.
              </p>
              <Button size="sm" onClick={() => setOpenNewTaskDialog(true)} className="mt-2 text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Schedule First Task
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer hover:bg-muted/40 ${
                    task.completed ? 'bg-muted/15' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 text-primary hover:text-primary/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(task)
                      }}
                    >
                      {task.completed ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs md:text-sm font-medium ${
                            task.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.id.startsWith('task-ai-') && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5">
                            <Bot className="h-3 w-3" />
                            AI Scheduled
                          </Badge>
                        )}

                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {task.subject && (
                          <span className="font-semibold text-foreground/80">{task.subject.code}</span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        <span>{task.duration_minutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    title="Remove task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
