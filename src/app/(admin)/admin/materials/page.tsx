'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useMaterials, useSubjects } from '@/hooks/use-data'
import { useUser } from '@/hooks/use-user'
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
import { FolderOpen, Plus, Search, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Material } from '@/types'

export default function AdminMaterialsPage() {
  const { profile } = useUser()
  const { materials, loading, refresh } = useMaterials()
  const { subjects } = useSubjects()

  const [searchTerm, setSearchTerm] = useState('')
  const [openUploadDialog, setOpenUploadDialog] = useState(false)

  // Upload Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<Material['type']>('notes')
  const [fileUrl, setFileUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectId || !profile) {
      toast.error('Select a course')
      return
    }
    setSaving(true)
    try {
      await DataService.createMaterial({
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId,
        type,
        file_url: fileUrl.trim() || null,
        uploaded_by: profile.id,
      })
      toast.success('Courseware published to campus!')
      setOpenUploadDialog(false)
      setTitle('')
      setDescription('')
      setFileUrl('')
      refresh()
    } catch {
      toast.error('Failed to upload material')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Delete this study resource?')) {
      await DataService.deleteMaterial(id)
      toast.success('Material removed')
      refresh()
    }
  }

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.subject?.code && m.subject.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Repository & Materials"
        description="Publish institutional lecture notes, syllabus decks, laboratory manuals, and recorded sessions"
      >
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateMaterial}>
              <DialogHeader>
                <DialogTitle>Publish Institutional Material</DialogTitle>
                <DialogDescription>
                  Upload documents, lecture presentations, or attach cloud resource links
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adm-mtitle">Document Title</Label>
                  <Input
                    id="adm-mtitle"
                    placeholder="e.g. Lecture 6: Database Normalization Slides"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-msub">Subject</Label>
                    <Select value={subjectId} onValueChange={setSubjectId} required>
                      <SelectTrigger id="adm-msub">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} - {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adm-mtype">Resource Format</Label>
                    <Select value={type} onValueChange={(v) => setType(v as Material['type'])}>
                      <SelectTrigger id="adm-mtype">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notes">Lecture Notes</SelectItem>
                        <SelectItem value="slides">Presentation Slides</SelectItem>
                        <SelectItem value="document">PDF / Document</SelectItem>
                        <SelectItem value="video">Recorded Video</SelectItem>
                        <SelectItem value="link">External URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adm-murl">Cloud / Artifact URL</Label>
                  <Input
                    id="adm-murl"
                    placeholder="https://... (Google Drive, Dropbox, YouTube, or direct link)"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adm-mdesc">Synopsis / Notes</Label>
                  <Input
                    id="adm-mdesc"
                    placeholder="Optional details or syllabus reference..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenUploadDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Publishing...' : 'Publish Resource'}
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
              <CardTitle className="text-lg">Published Learning Materials ({materials.length})</CardTitle>
              <CardDescription>All academic artifacts available to enrolled cohorts</CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          ) : filteredMaterials.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No materials published"
              description="Upload reference textbooks, presentations, or video links for your students."
            >
              <Button onClick={() => setOpenUploadDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Upload First Material
              </Button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="py-3 px-4 font-medium">Resource Title</th>
                    <th className="py-3 px-4 font-medium">Course Code</th>
                    <th className="py-3 px-4 font-medium">Format</th>
                    <th className="py-3 px-4 font-medium">Link / URL</th>
                    <th className="py-3 px-4 font-medium">Uploaded Date</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div>{m.title}</div>
                        {m.description && <div className="text-xs text-muted-foreground line-clamp-1">{m.description}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {m.subject?.code || '--'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {m.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {m.file_url ? (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline max-w-[200px] truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{m.file_url}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMaterial(m.id)}
                          title="Delete Material"
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
