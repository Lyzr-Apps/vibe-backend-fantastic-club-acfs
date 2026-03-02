'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FiZap, FiLoader, FiCpu, FiDatabase, FiServer, FiLayers } from 'react-icons/fi'

interface IdeaInputProps {
  onGeneratePlan: (idea: string, complexity: string) => void
  loading: boolean
}

const examplePrompts = [
  'School Management System',
  'Hospital CRM',
  'Inventory Tracker',
  'E-Commerce Platform',
  'Real Estate Portal',
]

const complexityOptions = [
  { value: 'basic', label: 'Basic CRUD', desc: 'Simple data operations' },
  { value: 'saas', label: 'Multi-tenant SaaS', desc: 'Isolated tenants & billing' },
  { value: 'complex', label: 'Complex Workflows', desc: 'Multi-step processes' },
]

const stages = [
  'Analyzing requirements...',
  'Designing modules...',
  'Structuring APIs...',
  'Building data models...',
]

function ComplexityIcon({ value }: { value: string }) {
  if (value === 'basic') return <FiDatabase className="w-5 h-5" />
  if (value === 'saas') return <FiLayers className="w-5 h-5" />
  return <FiServer className="w-5 h-5" />
}

export default function IdeaInput({ onGeneratePlan, loading }: IdeaInputProps) {
  const [idea, setIdea] = useState('')
  const [complexity, setComplexity] = useState('basic')
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    if (!loading) {
      setStageIdx(0)
      return
    }
    const interval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % stages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  const handleSubmit = () => {
    if (!idea.trim() || loading) return
    onGeneratePlan(idea.trim(), complexity)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-start justify-center min-h-full p-6 py-10">
        <div className="w-full max-w-2xl space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto glow-primary">
              <FiZap className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-4">What do you want to build?</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Describe your software idea in plain English. CloudForge will design the complete backend architecture.
            </p>
          </div>

          {/* Textarea */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the software you want to build..."
                className="min-h-[150px] bg-transparent border-none resize-none text-base focus-visible:ring-0 placeholder:text-muted-foreground/50"
                disabled={loading}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {idea.trim().length > 0 ? idea.trim().length + ' characters' : 'Type or pick an example below'}
                </span>
                <span className="text-xs text-muted-foreground">Ctrl+Enter to generate</span>
              </div>
            </CardContent>
          </Card>

          {/* Example Chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setIdea(prompt)}
                disabled={loading}
                className="px-3 py-1.5 text-xs rounded-full border border-border bg-secondary hover:bg-primary/15 hover:border-primary/50 hover:text-primary text-muted-foreground transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Complexity Selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-center text-muted-foreground">Complexity Level</p>
            <div className="grid grid-cols-3 gap-3">
              {complexityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setComplexity(opt.value)}
                  disabled={loading}
                  className={
                    'p-4 rounded-xl border text-left transition-all duration-200 ' +
                    (complexity === opt.value
                      ? 'border-primary bg-primary/10 glow-primary'
                      : 'border-border bg-card hover:border-primary/30')
                  }
                >
                  <div className={'mb-2 ' + (complexity === opt.value ? 'text-primary' : 'text-muted-foreground')}>
                    <ComplexityIcon value={opt.value} />
                  </div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !idea.trim()}
            className="w-full h-12 text-base font-semibold glow-primary gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                {stages[stageIdx]}
              </>
            ) : (
              <>
                <FiCpu className="w-5 h-5" />
                Generate Plan
              </>
            )}
          </Button>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-1">
                {stages.map((_, i) => (
                  <div
                    key={i}
                    className={
                      'h-1.5 rounded-full transition-all duration-500 ' +
                      (i === stageIdx ? 'w-8 bg-primary' : 'w-2 bg-muted')
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This may take a minute. Our AI agents are designing your entire backend.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
