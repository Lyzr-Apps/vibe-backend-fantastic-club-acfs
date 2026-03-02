'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FiPlus, FiBox, FiActivity, FiClock, FiExternalLink, FiZap } from 'react-icons/fi'

interface Project {
  id: string
  name: string
  description: string
  status: 'draft' | 'deployed' | 'failed'
  createdAt: string
  plan?: unknown
  deployment?: { base_url?: string }
}

interface DashboardProps {
  projects: Project[]
  onNewProject: () => void
  onSelectProject: (id: string) => void
}

export default function Dashboard({ projects, onNewProject, onSelectProject }: DashboardProps) {
  const deployedCount = projects.filter(p => p.status === 'deployed').length
  const recentCount = projects.filter(p => {
    const d = new Date(p.createdAt)
    const now = new Date()
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  }).length

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    deployed: 'bg-accent/20 text-accent',
    failed: 'bg-destructive/20 text-destructive',
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your AI-generated backend projects</p>
          </div>
          <Button onClick={onNewProject} className="glow-primary gap-2">
            <FiPlus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <FiBox className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deployedCount}</p>
                <p className="text-xs text-muted-foreground">Active Deployments</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-chart-3/15 flex items-center justify-center">
                <FiClock className="w-5 h-5" style={{ color: 'hsl(191 97% 70%)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentCount}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FiZap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Describe your software idea in plain English and CloudForge will generate a complete backend architecture with APIs, data models, and deployment.
              </p>
              <Button onClick={onNewProject} className="glow-primary gap-2">
                <FiPlus className="w-4 h-4" />
                Describe your first app idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                onClick={() => onSelectProject(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    <Badge variant="secondary" className={statusColors[project.status] ?? 'bg-muted text-muted-foreground'}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description?.slice(0, 100) ?? 'No description'}
                    {(project.description?.length ?? 0) > 100 ? '...' : ''}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.createdAt}</span>
                    {project.status === 'deployed' && project.deployment?.base_url && (
                      <span className="flex items-center gap-1 text-accent">
                        <FiExternalLink className="w-3 h-3" />
                        Live
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
