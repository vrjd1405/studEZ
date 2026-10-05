'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useGrades, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Award, TrendingUp, BookOpen, Plus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function GradesPage() {
  const { profile, role } = useUser()
  const { grades, loading, gpa } = useGrades(profile?.id)
  const { subjects } = useSubjects()
  const [selectedSemester, setSelectedSemester] = useState<string>('all')

  const filteredGrades = selectedSemester === 'all'
    ? grades
    : grades.filter((g) => g.semester.toString() === selectedSemester)

  // Overall statistics
  const totalEarnedCredits = filteredGrades.reduce((acc, g) => acc + (g.subject?.credits || 3), 0)
  const averagePercentage = filteredGrades.length > 0
    ? Math.round(filteredGrades.reduce((acc, g) => acc + (g.marks / (g.max_marks || 100)) * 100, 0) / filteredGrades.length)
    : 0

  const getGradeBadgeStyle = (grade?: string | null) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300'
      case 'B+':
      case 'B':
      case 'B-':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300'
      case 'C+':
      case 'C':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300'
      case 'D':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300'
      default:
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300'
    }
  }

  const canManage = role === 'admin' || role === 'teacher'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades & Transcripts"
        description="Official academic marks, semester grading, GPA records, and course performance"
      >
        {canManage && (
          <Button asChild>
            <Link href="/admin/grades">
              <Plus className="mr-2 h-4 w-4" />
              Manage Grades
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* GPA Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Cumulative GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {grades.length > 0 ? gpa : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Computed on a standard 4.0 grading scale
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredGrades.length > 0 ? `${averagePercentage}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {filteredGrades.length} evaluated course assessment{filteredGrades.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Credits Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredGrades.length > 0 ? totalEarnedCredits : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total academic credit points completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Detailed Academic Record</CardTitle>
              <CardDescription>Published examination results and semester letter grades</CardDescription>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredGrades.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No grades recorded yet"
              description="Evaluated exam results and letter grades will be published here by the academic department."
            >
              {canManage && (
                <Button asChild className="mt-4">
                  <Link href="/admin/grades">
                    Record Student Grade
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Subject Code</th>
                    <th className="py-3 px-4 font-medium">Subject Name</th>
                    <th className="py-3 px-4 font-medium">Semester</th>
                    <th className="py-3 px-4 font-medium">Assessment / Exam</th>
                    <th className="py-3 px-4 font-medium">Score</th>
                    <th className="py-3 px-4 font-medium">Percentage</th>
                    <th className="py-3 px-4 font-medium text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredGrades.map((g) => {
                    const pct = Math.round((g.marks / (g.max_marks || 100)) * 100)
                    return (
                      <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold">
                          {g.subject?.code || '--'}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          {g.subject?.name || 'Academic Subject'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          Sem {g.semester}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {g.exam?.title || 'Course Examination'}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          {g.marks} <span className="text-xs text-muted-foreground">/ {g.max_marks}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          {pct}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="outline" className={`font-bold px-2 py-0.5 text-xs ${getGradeBadgeStyle(g.grade)}`}>
                            {g.grade || 'P'}
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
