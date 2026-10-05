'use client'

import { useUser } from '@/hooks/use-user'
import {
  useAttendance,
  useAssignments,
  useExams,
  useSubjects,
  useMeetings,
  useGrades,
  useTeacherData,
} from '@/hooks/use-data'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getGreeting, parseDateSafe, formatDate } from '@/lib/utils'
import {
  CalendarCheck,
  FileText,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Clock,
  TrendingUp,
  Video,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile, loading: userLoading } = useUser()
  const { subjects, loading: subjectsLoading } = useSubjects()
  const { attendanceRate, totalClasses, loading: attLoading } = useAttendance(profile?.id)
  const { assignments, loading: assignLoading } = useAssignments()
  const { exams, loading: examsLoading } = useExams()
  const { meetings, loading: meetingsLoading } = useMeetings()
  const { gpa, loading: gradesLoading } = useGrades(profile?.id)
  const { assignedClasses, students: teacherStudents, loading: teacherDataLoading } = useTeacherData()

  const isTeacher = profile?.role === 'teacher'
  const isLoading =
    userLoading ||
    subjectsLoading ||
    assignLoading ||
    examsLoading ||
    meetingsLoading ||
    (isTeacher ? teacherDataLoading : attLoading || gradesLoading)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  // Filter schedules with safe date interpretation
  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)

  const pendingAssignments = assignments.filter((a) => {
    const t = parseDateSafe(a.due_date)?.getTime()
    return t ? t >= todayStart : true
  })

  const upcomingExams = exams.filter((e) => {
    const t = parseDateSafe(e.date, e.start_time)?.getTime()
    return t ? t >= todayStart : false
  })

  const upcomingMeetings = meetings.filter((m) => {
    const t = parseDateSafe(m.date, m.time)?.getTime()
    return t ? t >= now : false
  })

  // Unique student count for teacher
  const uniqueTeacherStudentIds = new Set(teacherStudents.map((s) => s.student_id))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${profile?.full_name?.split(' ')[0] || (isTeacher ? 'Professor' : 'Student')}`}
        description={
          isTeacher
            ? `Faculty Instruction Portal • ${profile?.department || 'Academic Department'} • Instructor Workspace`
            : profile?.department
            ? `${profile.department} • Year ${profile.year || 1}`
            : 'Welcome to your studEZ academic workspace'
        }
      >
        <Badge variant="outline" className="px-3 py-1 font-medium capitalize">
          {isTeacher ? 'Faculty / Instructor' : `Role: ${profile?.role || 'student'}`}
        </Badge>
      </PageHeader>

      {/* Metrics Row - Role Conditioned */}
      {isTeacher ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Assigned Courses"
            value={assignedClasses.length.toString()}
            description={`${assignedClasses.length} active course & section allocation${assignedClasses.length === 1 ? '' : 's'}`}
            icon={BookOpen}
            iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatCard
            title="Students Under Instruction"
            value={uniqueTeacherStudentIds.size.toString()}
            description={`Across ${assignedClasses.length} assigned class sections`}
            icon={Users}
            iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            title="Active Assignments"
            value={assignments.length.toString()}
            description={`${assignments.length} published for evaluation`}
            icon={FileText}
            iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <StatCard
            title="Scheduled Milestones"
            value={(upcomingMeetings.length + upcomingExams.length).toString()}
            description={`${upcomingMeetings.length} meetings • ${upcomingExams.length} exams`}
            icon={CalendarCheck}
            iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Overall Attendance"
            value={totalClasses > 0 ? `${attendanceRate}%` : '0%'}
            description={totalClasses > 0 ? `Across ${totalClasses} tracked sessions` : 'No sessions recorded yet'}
            icon={CalendarCheck}
            iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatCard
            title="Pending Assignments"
            value={pendingAssignments.length.toString()}
            description={
              pendingAssignments.length > 0
                ? `${pendingAssignments.length} assignment${pendingAssignments.length === 1 ? '' : 's'} to submit`
                : 'All caught up'
            }
            icon={FileText}
            iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            title="Upcoming Exams"
            value={upcomingExams.length.toString()}
            description={
              upcomingExams.length > 0
                ? `Next: ${upcomingExams[0]?.title || 'Scheduled'}`
                : 'No exams scheduled'
            }
            icon={GraduationCap}
            iconClassName="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatCard
            title="Current GPA"
            value={gpa !== '0.00' ? gpa : '--'}
            description={subjects.length > 0 ? `${subjects.length} active subject${subjects.length === 1 ? '' : 's'}` : 'Add subjects to enroll'}
            icon={TrendingUp}
            iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </div>
      )}

      {/* Main Grid: Schedule & Quick Navigation */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Academic Schedule */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Upcoming Schedule & Milestones</CardTitle>
              <CardDescription>
                {isTeacher
                  ? 'Scheduled course examinations, faculty meetings, and deadlines'
                  : 'Your next exams, meetings, and project deadlines'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/exams">
                Exams <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 && upcomingMeetings.length === 0 && pendingAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-2xl bg-muted/50 p-4 mb-3">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No upcoming academic deadlines</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Exams, assignments, and lectures will appear dynamically as they are scheduled by faculty or administrators.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingExams.slice(0, 2).map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{exam.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {exam.subject?.name || 'Academic Subject'} • Room {exam.room || 'TBD'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs font-medium">
                        {exam.date}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {exam.start_time} - {exam.end_time}
                      </div>
                    </div>
                  </div>
                ))}

                {pendingAssignments.slice(0, 2).map((assign) => (
                  <div
                    key={assign.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assign.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {assign.subject?.name || 'Assignment'} • Max Marks: {assign.max_marks}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        Due {formatDate(assign.due_date)}
                      </Badge>
                    </div>
                  </div>
                ))}

                {upcomingMeetings.slice(0, 2).map((meet) => (
                  <div
                    key={meet.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        <Video className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{meet.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {meet.time} {meet.end_time ? `- ${meet.end_time}` : ''} • {meet.type}
                        </div>
                      </div>
                    </div>
                    {meet.link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={meet.link} target="_blank" rel="noopener noreferrer">
                          Join Link
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Navigation - Role Conditioned */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Navigator</CardTitle>
              <CardDescription>
                {isTeacher ? 'Direct faculty controls & teaching tools' : 'Direct shortcuts to active modules'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isTeacher ? (
                <>
                  <Button variant="outline" className="w-full justify-start h-10 font-medium" asChild>
                    <Link href="/students">
                      <Users className="mr-2.5 h-4 w-4 text-blue-600" />
                      My Course Students & Marks
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/assignments">
                      <FileText className="mr-2.5 h-4 w-4 text-amber-600" />
                      Manage Assignments & Grades
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/attendance">
                      <CalendarCheck className="mr-2.5 h-4 w-4 text-emerald-600" />
                      Class Attendance Register
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/materials">
                      <BookOpen className="mr-2.5 h-4 w-4 text-purple-600" />
                      Course Notes & Study Guides
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/meetings">
                      <Video className="mr-2.5 h-4 w-4 text-rose-600" />
                      Host Class Meeting
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/attendance">
                      <CalendarCheck className="mr-2.5 h-4 w-4 text-emerald-600" />
                      View Attendance Details
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/assignments">
                      <FileText className="mr-2.5 h-4 w-4 text-blue-600" />
                      Submit Assignments
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/materials">
                      <BookOpen className="mr-2.5 h-4 w-4 text-amber-600" />
                      Study Materials & Notes
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/planner">
                      <Calendar className="mr-2.5 h-4 w-4 text-purple-600" />
                      Study Planner & Tasks
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-10 font-normal" asChild>
                    <Link href="/grades">
                      <TrendingUp className="mr-2.5 h-4 w-4 text-rose-600" />
                      Grade Reports & GPA
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Courses Section - Role Conditioned */}
      {isTeacher ? (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">My Assigned Teaching Courses</CardTitle>
              <CardDescription>
                Classes, sections, and curriculum under your direct academic instruction
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5 font-medium">
              <Link href="/students">
                <Users className="h-4 w-4 text-primary" />
                Manage Student Records
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {assignedClasses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">No courses allocated yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once your administrator assigns subject sections to your profile, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedClasses.map((cls) => {
                  const enrolledCount = teacherStudents.filter((s) => s.subject_id === cls.subject_id).length
                  return (
                    <div
                      key={cls.class_id}
                      className="rounded-xl border p-4 bg-card/60 hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {cls.subject_code}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Section {cls.section}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-base mt-2 line-clamp-1">{cls.subject_name}</h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          {cls.department} • Year {cls.year} • Sem {cls.semester}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-medium text-foreground">{enrolledCount} Students</span>
                          <span>•</span>
                          <span>{cls.credits} Credits</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-2">
                        <Button variant="default" size="sm" className="w-full text-xs h-8" asChild>
                          <Link href={`/students`}>
                            View Roster & Marks
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                          <Link href="/materials">
                            Notes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Enrolled Courses</CardTitle>
              <CardDescription>Current curriculum and active semester subjects</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/subjects">
                All Courses <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">No subjects enrolled yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Courses added by your administrator will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border p-4 bg-card/60 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {sub.code}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{sub.credits} Credits</span>
                    </div>
                    <h4 className="font-semibold text-base mt-2 line-clamp-1">{sub.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {sub.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <span>Sem {sub.semester}</span>
                      <span>{sub.teacher?.full_name || sub.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
