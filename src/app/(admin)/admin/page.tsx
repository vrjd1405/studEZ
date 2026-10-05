'use client'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useProfiles,
  useSubjects,
  useAttendance,
  useAssignments,
  useExams,
  useNotifications,
  useGrades,
} from '@/hooks/use-data'
import {
  Users,
  UserCog,
  BookOpen,
  Bell,
  CalendarCheck,
  FileText,
  GraduationCap,
  TrendingUp,
  Plus,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { profiles: students } = useProfiles('student')
  const { profiles: teachers } = useProfiles('teacher')
  const { subjects } = useSubjects()
  const { attendance, attendanceRate } = useAttendance()
  const { assignments } = useAssignments()
  const { exams } = useExams()
  const { notifications } = useNotifications()
  const { grades } = useGrades()

  return (
    <div className="space-y-6">
      <PageHeader
        title="CampusOS Executive Administration"
        description="Institutional registry overview, faculty directories, academic logistics, and compliance metrics"
      >
        <Badge variant="outline" className="px-3 py-1 text-xs font-semibold gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administrator Console
        </Badge>
      </PageHeader>

      {/* Primary Institutional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Registered Students"
          value={students.length.toString()}
          icon={Users}
          description="Enrolled in active cohorts"
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Appointed Faculty"
          value={teachers.length.toString()}
          icon={UserCog}
          description="Professors & Instructors"
          iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Active Curriculum"
          value={subjects.length.toString()}
          icon={BookOpen}
          description="Department accredited courses"
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Broadcast Notices"
          value={notifications.length.toString()}
          icon={Bell}
          description="Institutional announcements"
          iconClassName="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
        />
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance Compliance"
          value={attendance.length > 0 ? `${attendanceRate}%` : '0%'}
          icon={CalendarCheck}
          description={`${attendance.length} total logged sessions`}
          iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Coursework Assignments"
          value={assignments.length.toString()}
          icon={FileText}
          description="Active institutional deliverables"
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Scheduled Exams"
          value={exams.length.toString()}
          icon={GraduationCap}
          description="Midterm & final timetables"
          iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatCard
          title="Evaluated Grades"
          value={grades.length.toString()}
          icon={TrendingUp}
          description="Transcripts on record"
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Quick Administration Workflow Hub */}
      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg">Administrative Operations & Quick Dispatch</CardTitle>
          <CardDescription>Direct shortcuts to registry and institutional governance actions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/students">
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Onboard Student</div>
                <div className="text-[10px] text-muted-foreground">Manage student roster</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/teachers">
              <UserCog className="mr-2 h-4 w-4 text-emerald-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Faculty Directory</div>
                <div className="text-[10px] text-muted-foreground">Assign instructors</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/subjects">
              <BookOpen className="mr-2 h-4 w-4 text-amber-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Curriculum Catalog</div>
                <div className="text-[10px] text-muted-foreground">Create & configure courses</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/notifications">
              <Bell className="mr-2 h-4 w-4 text-rose-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Broadcast Notice</div>
                <div className="text-[10px] text-muted-foreground">Campus-wide announcements</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/attendance">
              <CalendarCheck className="mr-2 h-4 w-4 text-emerald-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Roster Attendance</div>
                <div className="text-[10px] text-muted-foreground">Class session logs</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/exams">
              <GraduationCap className="mr-2 h-4 w-4 text-purple-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Exam Scheduler</div>
                <div className="text-[10px] text-muted-foreground">Hall allocation & dates</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/grades">
              <TrendingUp className="mr-2 h-4 w-4 text-amber-600" />
              <div className="text-left">
                <div className="text-xs font-semibold">Grade Entry</div>
                <div className="text-[10px] text-muted-foreground">Publish exam results</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href="/admin/meetings">
              <Plus className="mr-2 h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-xs font-semibold">Schedule Lectures</div>
                <div className="text-[10px] text-muted-foreground">Live video sessions</div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
