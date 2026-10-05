'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useSubjects, useProfiles } from '@/hooks/use-data'
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
import { BookOpen, Plus, Search, Trash2, Award } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSubjectsPage() {
  const { subjects, loading, refresh } = useSubjects()
  const { profiles: teachers } = useProfiles('teacher')
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [openAddDialog, setOpenAddDialog] = useState(false)

  // Form states
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [semester, setSemester] = useState('1')
  const [credits, setCredits] = useState('3')
  const [teacherId, setTeacherId] = useState<string>('none')
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
        teacher_id: teacherId !== 'none' ? teacherId : null,
      })
      toast.success('Course created in curriculum!')
      setOpenAddDialog(false)
      setCode('')
      setName('')
      setDescription('')
      setTeacherId('none')
      refresh()
    } catch {
      toast.error('Failed to create course')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Are you sure you want to remove this course from curriculum?')) {
      await DataService.deleteSubject(id)
      toast.success('Subject removed')
      refresh()
    }
  }

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = deptFilter === 'all' || s.department === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum & Course Catalog"
        description="Configure institutional academic subjects, credit allocations, and assign faculty instructors"
      >
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateSubject}>
              <DialogHeader>
                <DialogTitle>Add Subject to Curriculum</DialogTitle>
                <DialogDescription>
                  Define course code, credit points, and assign responsible faculty
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-code">Course Code</Label>
                    <Input
                      id="c-code"
                      placeholder="e.g. CS201"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-credits">Credit Weight</Label>
                    <Input
                      id="c-credits"
                      type="number"
                      min="1"
                      max="10"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Course Name</Label>
                  <Input
                    id="c-name"
                    placeholder="e.g. Operating Systems & Kernel Design"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-dept">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="c-dept">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Information Technology">Information Tech</SelectItem>
                        <SelectItem value="Electrical Engineering">Electrical Eng</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Eng</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="c-sem">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger id="c-sem">
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
                  <Label htmlFor="c-teacher">Assigned Faculty Instructor</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger id="c-teacher">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Instructor Assigned</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.full_name} ({t.department || 'Faculty'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-desc">Course Overview / Syllabus</Label>
                  <Input
                    id="c-desc"
                    placeholder="Key topics and learning outcomes..."
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
                  {saving ? 'Creating...' : 'Register Course'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Curriculum Catalog ({subjects.length})</CardTitle>
              <CardDescription>All authorized degree courses across campus</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Tech</SelectItem>
                  <SelectItem value="Electrical Engineering">Electrical Eng</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Eng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses configured"
              description="Add academic subjects to define the curriculum and enable student enrollments."
            >
              <Button onClick={() => setOpenAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Course
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Code</th>
                    <th className="py-3 px-4 font-medium">Course Title</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Semester</th>
                    <th className="py-3 px-4 font-medium">Credits</th>
                    <th className="py-3 px-4 font-medium">Faculty Lead</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        {sub.code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {sub.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {sub.department}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        Sem {sub.semester}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-amber-500" />
                          {sub.credits}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {sub.teacher?.full_name || (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSubject(sub.id)}
                          title="Delete Course"
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
