'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useSubjects } from '@/hooks/use-data'
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
import { BookOpen, Plus, Search, User, Award, Layers, FolderOpen, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SubjectsPage() {
  const { subjects, loading, refresh } = useSubjects()
  const { role, profile } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [openAddDialog, setOpenAddDialog] = useState(false)

  // Form states
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [semester, setSemester] = useState('1')
  const [credits, setCredits] = useState('3')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await DataService.createSubject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        department,
        semester: parseInt(semester, 10) || 1,
        credits: parseInt(credits, 10) || 3,
        description: description.trim() || null,
        teacher_id: role === 'teacher' ? profile?.id || null : null,
      })
      toast.success('Subject added successfully!')
      setOpenAddDialog(false)
      setCode('')
      setName('')
      setDescription('')
      refresh()
    } catch {
      toast.error('Failed to add subject')
    } finally {
      setSaving(false)
    }
  }

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum & Subjects"
        description="View enrolled courses, syllabus details, faculty contacts, and study resources"
      >
        {canManage && (
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleCreateSubject}>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Define course parameters to add it to the institutional curriculum
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Course Code</Label>
                      <Input
                        id="code"
                        placeholder="e.g. CS101"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="8"
                        value={credits}
                        onChange={(e) => setCredits(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">Subject Title</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dept">Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger id="dept">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Information Technology">Information Technology</SelectItem>
                          <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                          <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Sciences">Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="sem">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger id="sem">
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
                    <Label htmlFor="desc">Course Description</Label>
                    <Input
                      id="desc"
                      placeholder="Brief overview of course modules..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Subject'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code or department..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground self-center">
          Showing {filteredSubjects.length} of {subjects.length} course{subjects.length === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={
            searchTerm
              ? `No subjects match "${searchTerm}". Try another search term.`
              : 'No subjects have been added to the institutional curriculum yet.'
          }
        >
          {canManage && (
            <Button onClick={() => setOpenAddDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create First Subject
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((sub) => (
            <Card key={sub.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                    {sub.code}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <span>{sub.credits} Credits</span>
                  </div>
                </div>
                <CardTitle className="text-lg mt-2 line-clamp-1">{sub.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {sub.description || 'Comprehensive curriculum including core concepts, practical assignments, and exams.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground pt-0">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>{sub.department} • Semester {sub.semester}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Faculty: {sub.teacher?.full_name || 'Assigned Instructor'}</span>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3 flex gap-2">
                {role === 'teacher' && (
                  <Button variant="default" size="sm" className="flex-1 text-xs" asChild>
                    <Link href="/students">
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      Students
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href="/materials">
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                    Materials
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                  <Link href="/assignments">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Assignments
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
