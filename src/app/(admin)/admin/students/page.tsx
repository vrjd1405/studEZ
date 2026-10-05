'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useProfiles } from '@/hooks/use-data'
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
import { Users, Plus, Search, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminStudentsPage() {
  const { profiles: students, loading, refresh } = useProfiles('student')
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [openAddDialog, setOpenAddDialog] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('Computer Science')
  const [year, setYear] = useState('1')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await DataService.createProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        role: 'student',
        department,
        year: parseInt(year, 10) || 1,
        phone: phone.trim() || null,
        avatar_url: null,
      })
      toast.success('Student account created!')
      setOpenAddDialog(false)
      setFullName('')
      setEmail('')
      setPhone('')
      refresh()
    } catch {
      toast.error('Failed to create student')
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = deptFilter === 'all' || s.department === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory & Registry"
        description="Manage enrolled student records, cohorts, academic departments, and contact methods"
      >
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateStudent}>
              <DialogHeader>
                <DialogTitle>Enroll New Student</DialogTitle>
                <DialogDescription>
                  Register student profile into central institutional database
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="st-name">Full Name</Label>
                  <Input
                    id="st-name"
                    placeholder="e.g. Jordan Lee"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="st-email">Institutional Email</Label>
                  <Input
                    id="st-email"
                    type="email"
                    placeholder="jordan.lee@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="st-dept">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="st-dept">
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
                    <Label htmlFor="st-year">Academic Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger id="st-year">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1 (Freshman)</SelectItem>
                        <SelectItem value="2">Year 2 (Sophomore)</SelectItem>
                        <SelectItem value="3">Year 3 (Junior)</SelectItem>
                        <SelectItem value="4">Year 4 (Senior)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="st-phone">Phone Number</Label>
                  <Input
                    id="st-phone"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Registering...' : 'Enroll Student'}
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
              <CardTitle className="text-lg">Registered Students ({students.length})</CardTitle>
              <CardDescription>Directory of all actively registered students</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
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
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description={
                searchTerm || deptFilter !== 'all'
                  ? 'No students match your search criteria. Try a different query.'
                  : 'Enroll your first student to begin managing course assignments and cohorts.'
              }
            >
              <Button onClick={() => setOpenAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Student Name</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Cohort Year</th>
                    <th className="py-3 px-4 font-medium">Phone</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar_url || ''} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {getInitials(student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{student.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{student.email}</td>
                      <td className="py-3 px-4">{student.department || 'General'}</td>
                      <td className="py-3 px-4">Year {student.year || 1}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{student.phone || '--'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                          Active
                        </Badge>
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
