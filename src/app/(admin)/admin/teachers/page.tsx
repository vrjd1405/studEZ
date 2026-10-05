'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useProfiles, useSubjects } from '@/hooks/use-data'
import { DataService } from '@/lib/data-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { UserCog, Plus, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminTeachersPage() {
  const { profiles: teachers, loading, refresh } = useProfiles('teacher')
  const { subjects } = useSubjects()
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [openAddDialog, setOpenAddDialog] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await DataService.createProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        role: 'teacher',
        department,
        year: null,
        phone: phone.trim() || null,
        avatar_url: null,
      })
      toast.success('Faculty member registered!')
      setOpenAddDialog(false)
      setFullName('')
      setEmail('')
      setPhone('')
      refresh()
    } catch {
      toast.error('Failed to register faculty')
    } finally {
      setSaving(false)
    }
  }

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = deptFilter === 'all' || t.department === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty & Instructor Directory"
        description="Manage academic faculty, department chairs, course appointments, and contact credentials"
      >
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Appoint Faculty
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateTeacher}>
              <DialogHeader>
                <DialogTitle>Register Faculty Member</DialogTitle>
                <DialogDescription>
                  Grant teacher permissions and assign department affiliation
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tc-name">Full Name & Title</Label>
                  <Input
                    id="tc-name"
                    placeholder="e.g. Dr. Robert Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tc-email">Institutional Email</Label>
                  <Input
                    id="tc-email"
                    type="email"
                    placeholder="robert.chen@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tc-dept">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="tc-dept">
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
                    <Label htmlFor="tc-phone">Office Phone</Label>
                    <Input
                      id="tc-phone"
                      placeholder="+1 555-0145"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Registering...' : 'Confirm Appointment'}
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
              <CardTitle className="text-lg">Faculty Members ({teachers.length})</CardTitle>
              <CardDescription>All authorized teaching staff and department researchers</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculty..."
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
          ) : filteredTeachers.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="No faculty members found"
              description={
                searchTerm || deptFilter !== 'all'
                  ? 'No teachers match your search query.'
                  : 'Register faculty instructors to begin assigning courses and curriculum.'
              }
            >
              <Button onClick={() => setOpenAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Appoint Faculty
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Faculty Member</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Assigned Courses</th>
                    <th className="py-3 px-4 font-medium">Contact</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTeachers.map((teacher) => {
                    const assignedCourses = subjects.filter((s) => s.teacher_id === teacher.id)
                    return (
                      <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={teacher.avatar_url || ''} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300">
                                {getInitials(teacher.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground">{teacher.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{teacher.email}</td>
                        <td className="py-3 px-4">{teacher.department || 'Academic'}</td>
                        <td className="py-3 px-4">
                          {assignedCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedCourses.map((c) => (
                                <Badge key={c.id} variant="secondary" className="font-mono text-[10px]">
                                  {c.code}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{teacher.phone || '--'}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                            Active Faculty
                          </Badge>
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
    </div>
  )
}
