'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  UserCheck,
  Building2,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  Hash,
  Briefcase,
  BookOpen,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<string[]>([
    'CSE',
    'CSE(AI & ML)',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
  ])

  // Common fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Student specific fields
  const [registerNumber, setRegisterNumber] = useState('')
  const [department, setDepartment] = useState('CSE')
  const [year, setYear] = useState('1st Year')
  const [semester, setSemester] = useState('1')
  const [section, setSection] = useState('A')
  const [batch, setBatch] = useState('2024-2028')
  const [admissionYear, setAdmissionYear] = useState('2024')

  // Teacher specific fields
  const [employeeId, setEmployeeId] = useState('')
  const [designation, setDesignation] = useState('Assistant Professor')
  const [subjectsTaught, setSubjectsTaught] = useState('')

  // Dynamically update available semesters when year changes
  useEffect(() => {
    if (year === '1st Year') setSemester('1')
    else if (year === '2nd Year') setSemester('3')
    else if (year === '3rd Year') setSemester('5')
    else if (year === '4th Year') setSemester('7')
  }, [year])

  // Fetch departments from database
  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data.map((d: any) => d.department_code || d.name))
        }
      })
      .catch(() => {})
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        role,
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
        phone,
      }

      if (role === 'student') {
        payload.register_number = registerNumber
        payload.department = department
        payload.year = year
        payload.semester = parseInt(semester, 10)
        payload.section = section
        payload.batch = batch
        payload.admission_year = parseInt(admissionYear, 10)
      } else {
        payload.employee_id = employeeId
        payload.department = department
        payload.designation = designation
        payload.subjects = subjectsTaught
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || 'Registration successful!')
        if (typeof window !== 'undefined') {
          localStorage.setItem('studez_active_role', role)
          window.dispatchEvent(new Event('studez_role_switched'))
          window.dispatchEvent(new Event('studez_data_changed'))
        }
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to register account')
      }
    } catch {
      toast.error('Network connection error during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl px-4 py-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-2">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Create studEZ Account</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Join the centralized campus academic network
        </p>
      </div>

      <Card className="shadow-2xl border-border/70 backdrop-blur-md">
        <CardHeader className="pb-3 pt-5">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'teacher'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Teacher / Faculty</span>
            </button>
          </div>

          <CardDescription className="text-xs text-center">
            {role === 'student'
              ? 'Complete your academic cohort details for automated course and notes targeting.'
              : 'Complete your faculty appointment profile to manage classes and curricula.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Common Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    required
                    placeholder="e.g. Alex Johnson"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Campus Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    placeholder="alex@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    required
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    required
                    type="password"
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department *</Label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Specific Section */}
            {role === 'student' ? (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Student Academic Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Register Number *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        required
                        placeholder="e.g. REG2024CS099"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                        className="pl-8 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Academic Year *</Label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Semester</Label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs"
                    >
                      {year === '1st Year' && (
                        <>
                          <option value="1">Sem 1</option>
                          <option value="2">Sem 2</option>
                        </>
                      )}
                      {year === '2nd Year' && (
                        <>
                          <option value="3">Sem 3</option>
                          <option value="4">Sem 4</option>
                        </>
                      )}
                      {year === '3rd Year' && (
                        <>
                          <option value="5">Sem 5</option>
                          <option value="6">Sem 6</option>
                        </>
                      )}
                      {year === '4th Year' && (
                        <>
                          <option value="7">Sem 7</option>
                          <option value="8">Sem 8</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Section *</Label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs"
                    >
                      <option value="A">Sec A</option>
                      <option value="B">Sec B</option>
                      <option value="C">Sec C</option>
                      <option value="D">Sec D</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Batch</Label>
                    <Input
                      placeholder="2024-2028"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Faculty Appointment Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Employee ID *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        required
                        placeholder="e.g. EMP402"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                        className="pl-8 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Designation *</Label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Head of Department">Head of Department (HOD)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Subjects Taught</Label>
                  <Input
                    placeholder="e.g. Python Programming, Data Structures"
                    value={subjectsTaught}
                    onChange={(e) => setSubjectsTaught(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-semibold shadow gap-2 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Register & Access Dashboard</span>
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t pt-3 pb-3 text-center bg-muted/20">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span>Already have an account?</span>
            <Link href="/login" className="font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
