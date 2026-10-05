'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Building,
  GraduationCap,
  Briefcase,
  X,
  Phone,
  Mail,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types'

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [viewUser, setViewUser] = useState<Profile | null>(null)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [createModal, setCreateModal] = useState<'student' | 'teacher' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch users from central database
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (deptFilter !== 'all') params.set('department', deptFilter)
      if (yearFilter !== 'all') params.set('year', yearFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        toast.error('Failed to load users from database')
      }
    } catch {
      toast.error('Network connection error while fetching registry')
    } finally {
      setLoading(false)
    }
  }, [search, deptFilter, yearFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users by active tab
  const filteredUsers = users.filter((u) => u.role === activeTab)

  // Toggle user activation status
  const handleToggleStatus = async (user: Profile) => {
    const newStatus = user.account_status === 'inactive' ? 'active' : 'inactive'
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, account_status: newStatus }),
      })

      if (res.ok) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      } else {
        toast.error('Failed to update account status')
      }
    } catch {
      toast.error('Network connection error')
    }
  }

  // Handle Edit submission
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return

    setActionLoading(true)
    try {
      const payload: any = {
        id: editUser.id,
        full_name: editUser.full_name,
        email: editUser.email,
        phone: editUser.phone,
        account_status: editUser.account_status,
      }

      if (editUser.role === 'student' && editUser.student) {
        payload.department = editUser.student.department
        payload.year = editUser.student.year
        payload.semester = editUser.student.semester
        payload.section = editUser.student.section
        payload.register_number = editUser.student.register_number
      } else if (editUser.role === 'teacher' && editUser.teacher) {
        payload.department = editUser.teacher.department
        payload.designation = editUser.teacher.designation
        payload.employee_id = editUser.teacher.employee_id
        payload.subjects = editUser.teacher.subjects
      }

      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('User updated in central database. Changes reflect everywhere.')
        setEditUser(null)
        fetchUsers()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('studez_data_changed'))
        }
      } else {
        toast.error(data.error || 'Failed to update user')
      }
    } catch {
      toast.error('Network error during user update')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Create submission
  const handleSaveCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    setActionLoading(true)
    try {
      const payload: any = {
        role: createModal,
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password') || 'password123',
        phone: formData.get('phone'),
      }

      if (createModal === 'student') {
        payload.register_number = formData.get('register_number')
        payload.department = formData.get('department')
        payload.year = formData.get('year')
        payload.semester = parseInt(formData.get('semester') as string, 10) || 1
        payload.section = formData.get('section')
      } else {
        payload.employee_id = formData.get('employee_id')
        payload.department = formData.get('department')
        payload.designation = formData.get('designation')
        payload.subjects = formData.get('subjects')
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`${createModal === 'student' ? 'Student' : 'Teacher'} registered in central database!`)
        setCreateModal(null)
        fetchUsers()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('studez_data_changed'))
        }
      } else {
        toast.error(data.error || 'Failed to create user')
      }
    } catch {
      toast.error('Network error creating user')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Institutional User Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage students, faculty, and administrators across all campus departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModal('student')}
            size="sm"
            className="gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Student</span>
          </Button>
          <Button
            onClick={() => setCreateModal('teacher')}
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Teacher</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Filters Card */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4 space-y-4">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'student' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('student')}
                className="gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Students ({users.filter((u) => u.role === 'student').length})</span>
              </Button>
              <Button
                variant={activeTab === 'teacher' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('teacher')}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                <span>Teachers ({users.filter((u) => u.role === 'teacher').length})</span>
              </Button>
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('admin')}
                className="gap-2"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admins ({users.filter((u) => u.role === 'admin').length})</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers()}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="CSE(AI & ML)">CSE(AI & ML)</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>

            {activeTab === 'student' && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
              >
                <option value="all">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Querying central database registry...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No matching accounts found.</p>
              <p className="text-xs text-muted-foreground">Adjust filters or create a new record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[11px] border-b">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    {activeTab === 'student' ? (
                      <>
                        <th className="px-4 py-3">Register No</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Year / Sem</th>
                        <th className="px-4 py-3">Section</th>
                      </>
                    ) : activeTab === 'teacher' ? (
                      <>
                        <th className="px-4 py-3">Employee ID</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Designation / Subjects</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                      </>
                    )}
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-[11px] text-muted-foreground">{user.email}</div>
                      </td>

                      {activeTab === 'student' && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium">
                            {user.student?.register_number || user.register_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]">
                              {user.student?.department || user.department || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.student?.year || user.year || '1st Year'}{' '}
                            <span className="text-muted-foreground">
                              (Sem {user.student?.semester || user.semester || 1})
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            Sec {user.student?.section || user.section || 'A'}
                          </td>
                        </>
                      )}

                      {activeTab === 'teacher' && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium">
                            {user.teacher?.employee_id || user.employee_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]">
                              {user.teacher?.department || user.department || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{user.teacher?.designation || 'Faculty'}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                              {user.teacher?.subjects || 'General Curriculum'}
                            </div>
                          </td>
                        </>
                      )}

                      {activeTab === 'admin' && (
                        <>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="default" className="text-[10px] bg-purple-600">
                              ADMIN
                            </Badge>
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3">
                        <Badge
                          variant={user.account_status === 'active' ? 'default' : 'destructive'}
                          className="text-[10px] capitalize"
                        >
                          {user.account_status || 'active'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewUser(user)}
                            className="h-7 w-7"
                            title="View Full Profile"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditUser(JSON.parse(JSON.stringify(user)))}
                            className="h-7 w-7"
                            title="Edit User"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            className="h-7 w-7"
                            title={user.account_status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {user.account_status === 'active' ? (
                              <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW PROFILE MODAL */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm">Full Profile Overview</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <div className="text-base font-bold text-foreground">{viewUser.full_name}</div>
                  <div className="text-muted-foreground">{viewUser.email}</div>
                </div>
                <Badge variant="outline" className="capitalize text-xs">
                  {viewUser.role}
                </Badge>
              </div>

              {viewUser.role === 'student' && viewUser.student && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Register No:</span>
                      <p className="font-semibold font-mono">{viewUser.student.register_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-semibold">{viewUser.student.department}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year & Sem:</span>
                      <p className="font-semibold">
                        {viewUser.student.year} (Semester {viewUser.student.semester})
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Section:</span>
                      <p className="font-semibold">Section {viewUser.student.section}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batch:</span>
                      <p className="font-semibold">{viewUser.student.batch || '2024-2028'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-semibold">{viewUser.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {viewUser.role === 'teacher' && viewUser.teacher && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Employee ID:</span>
                      <p className="font-semibold font-mono">{viewUser.teacher.employee_id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-semibold">{viewUser.teacher.department}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Designation:</span>
                      <p className="font-semibold">{viewUser.teacher.designation}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Subjects:</span>
                      <p className="font-semibold">{viewUser.teacher.subjects || 'General Curriculum'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Account Status: {viewUser.account_status || 'active'}</span>
                <span>User ID: {viewUser.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm">Edit {editUser.role.toUpperCase()} Details</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    required
                    value={editUser.full_name}
                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Campus Email</Label>
                  <Input
                    required
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {editUser.role === 'student' && editUser.student && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                    Academic Enrollment (Single Source of Truth)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Department</Label>
                      <select
                        value={editUser.student.department}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            student: { ...editUser.student!, department: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="CSE">CSE</option>
                        <option value="CSE(AI & ML)">CSE(AI & ML)</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Year</Label>
                      <select
                        value={editUser.student.year}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            student: { ...editUser.student!, year: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Semester</Label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={editUser.student.semester}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            student: { ...editUser.student!, semester: parseInt(e.target.value, 10) || 1 },
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Section</Label>
                      <select
                        value={editUser.student.section}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            student: { ...editUser.student!, section: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {editUser.role === 'teacher' && editUser.teacher && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                    Faculty Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Department</Label>
                      <select
                        value={editUser.teacher.department}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            teacher: { ...editUser.teacher!, department: e.target.value },
                          })
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="CSE">CSE</option>
                        <option value="CSE(AI & ML)">CSE(AI & ML)</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Designation</Label>
                      <Input
                        value={editUser.teacher.designation}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            teacher: { ...editUser.teacher!, designation: e.target.value },
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading} className="gap-1.5">
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm">
                  Create New {createModal === 'student' ? 'Student Account' : 'Faculty Member'}
                </h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveCreate} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Full Name *</Label>
                  <Input required name="full_name" placeholder="e.g. Test Student" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Email *</Label>
                  <Input required type="email" name="email" placeholder="student@campus.edu" className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Initial Password</Label>
                  <Input name="password" placeholder="Default: password123" className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input name="phone" placeholder="+1 555-0100" className="h-9 text-xs" />
                </div>
              </div>

              {createModal === 'student' ? (
                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Register Number *</Label>
                      <Input required name="register_number" placeholder="STU001" className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Department *</Label>
                      <select name="department" defaultValue="CSE" className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                        <option value="CSE">CSE</option>
                        <option value="CSE(AI & ML)">CSE(AI & ML)</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Year *</Label>
                      <select name="year" defaultValue="1st Year" className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Section *</Label>
                      <select name="section" defaultValue="A" className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-muted/30 rounded-xl border">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Employee ID *</Label>
                      <Input required name="employee_id" placeholder="FAC201" className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Department *</Label>
                      <select name="department" defaultValue="CSE" className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                        <option value="CSE">CSE</option>
                        <option value="CSE(AI & ML)">CSE(AI & ML)</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs font-semibold">Designation</Label>
                      <Input name="designation" defaultValue="Assistant Professor" className="h-9 text-xs" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading} className="gap-1.5">
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Create Account</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
