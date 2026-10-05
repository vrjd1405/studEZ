'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useAttendance, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, Clock, BookOpen, Users } from 'lucide-react'
import Link from 'next/link'

export default function AttendancePage() {
  const { profile, role } = useUser()
  const { attendance, loading, totalClasses, presentCount, lateCount, attendanceRate } = useAttendance(profile?.id)
  const { subjects } = useSubjects()
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const absentCount = totalClasses - (presentCount + lateCount)

  // Subject-wise grouping
  const subjectAttendance = subjects.map((sub) => {
    const records = attendance.filter((a) => a.subject_id === sub.id)
    const subTotal = records.length
    const subPresent = records.filter((r) => r.status === 'present').length
    const subLate = records.filter((r) => r.status === 'late').length
    const subRate = subTotal > 0 ? Math.round(((subPresent + subLate * 0.5) / subTotal) * 100) : 0
    return {
      ...sub,
      total: subTotal,
      present: subPresent,
      late: subLate,
      absent: subTotal - (subPresent + subLate),
      rate: subRate,
    }
  })

  const filteredRecords = selectedSubject === 'all'
    ? attendance
    : attendance.filter((a) => a.subject_id === selectedSubject)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Punctuality"
        description="Monitor attendance compliance across curriculum subjects and review session logs"
      >
        {(role === 'admin' || role === 'teacher') && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/students">
                <Users className="mr-2 h-4 w-4" />
                Course Student Records
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/attendance">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Record Attendance
              </Link>
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Overall Attendance</span>
              {totalClasses > 0 && attendanceRate < 75 ? (
                <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0 h-4">
                  <AlertTriangle className="h-3 w-3" /> Below 75%
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0 h-4">
                  Good Standing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalClasses > 0 ? `${attendanceRate}%` : '0%'}
            </div>
            <Progress
              value={attendanceRate}
              className={`mt-3 h-2 ${attendanceRate < 75 ? 'bg-muted' : ''}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 75% attendance required for examination eligibility
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Classes Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {presentCount + lateCount}{' '}
              <span className="text-base font-normal text-muted-foreground">/ {totalClasses}</span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> {presentCount} Present
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="h-3.5 w-3.5" /> {lateCount} Late
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalClasses > 0 ? 'Total logged academic contact hours' : 'No recorded classes yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences & Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              {absentCount}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              <span>{absentCount === 0 ? 'Zero unexcused absences' : `${absentCount} sessions missed`}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Medical or excused leaves require Dean approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance Breakdown */}
      {subjects.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Course-Wise Attendance Breakdown</CardTitle>
            <CardDescription>Individual compliance track across your registered curriculum</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjectAttendance.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {sub.code}
                    </Badge>
                    <span className="text-sm font-bold">
                      {sub.total > 0 ? `${sub.rate}%` : '0%'}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm line-clamp-1">{sub.name}</h4>
                  <Progress value={sub.rate} className="h-1.5" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{sub.present + sub.late} / {sub.total} sessions</span>
                    <span>{sub.absent} absent</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Attendance Records */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Session Attendance History</CardTitle>
              <CardDescription>Verified attendance registers signed by course instructors</CardDescription>
            </div>
            {subjects.length > 0 && (
              <div className="w-full sm:w-56">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records"
              description="Attendance records will appear here as soon as instructors log class attendance registers."
            >
              {(role === 'admin' || role === 'teacher') && (
                <Button asChild className="mt-4">
                  <Link href="/admin/attendance">
                    Log Class Attendance
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Subject</th>
                    <th className="py-3 px-4 font-medium">Course Code</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{r.date}</td>
                      <td className="py-3 px-4">{r.subject?.name || 'Class Session'}</td>
                      <td className="py-3 px-4 font-mono text-xs">{r.subject?.code || '--'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={`capitalize text-xs font-semibold ${r.status === 'present'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : r.status === 'late'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
