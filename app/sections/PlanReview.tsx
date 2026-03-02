'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { FiSend, FiLoader, FiChevronDown, FiChevronUp, FiLock, FiUnlock, FiCheck, FiX, FiMessageSquare, FiBox, FiDatabase, FiShield, FiGlobe, FiGitBranch, FiRocket } from 'react-icons/fi'

interface Feature {
  name: string; description: string; sub_features: string[]
}
interface Workflow {
  name: string; steps: string[]
}
interface Module {
  name: string; description: string; features: Feature[]; workflows: Workflow[]
}
interface Attribute {
  name: string; type: string; required: boolean; description: string
}
interface GSI {
  name: string; partition_key: string; sort_key: string
}
interface Relationship {
  target_entity: string; type: string; foreign_key: string
}
interface Entity {
  name: string; description: string; table_name: string; partition_key: string; sort_key: string; attributes: Attribute[]; gsi: GSI[]; relationships: Relationship[]
}
interface Endpoint {
  module: string; method: string; path: string; description: string; auth_required: boolean; allowed_roles: string[]
}
interface Role {
  name: string; description: string; permissions: string[]
}
interface AuthFlow {
  provider: string; sign_up_flow: string[]; sign_in_flow: string[]; token_refresh: string[]; password_reset: string[]
}
interface PlanData {
  project_name: string; project_description: string; modules: Module[]; entities: Entity[]; endpoints: Endpoint[]; roles: Role[]; auth_flow: AuthFlow
}
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
interface PlanReviewProps {
  plan: PlanData
  onUpdatePlan: (plan: PlanData) => void
  onApproveAndDeploy: () => void
  deploying: boolean
  chatMessages: ChatMessage[]
  onSendMessage: (message: string) => void
  chatLoading: boolean
}

function MethodBadge({ method }: { method: string }) {
  const m = (method ?? '').toUpperCase()
  const cls: Record<string, string> = { GET: 'method-get', POST: 'method-post', PUT: 'method-put', DELETE: 'method-delete' }
  return <span className={`font-mono text-xs font-bold ${cls[m] ?? 'text-muted-foreground'}`}>{m}</span>
}

export default function PlanReview({ plan, onUpdatePlan, onApproveAndDeploy, deploying, chatMessages, onSendMessage, chatLoading }: PlanReviewProps) {
  const [expandedMods, setExpandedMods] = useState<Record<number, boolean>>({})
  const [expandedEntities, setExpandedEntities] = useState<Record<number, boolean>>({})
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<number, boolean>>({})
  const [chatInput, setChatInput] = useState('')
  const [showDeployConfirm, setShowDeployConfirm] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const modules = Array.isArray(plan?.modules) ? plan.modules : []
  const entities = Array.isArray(plan?.entities) ? plan.entities : []
  const endpoints = Array.isArray(plan?.endpoints) ? plan.endpoints : []
  const roles = Array.isArray(plan?.roles) ? plan.roles : []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    if (!chatInput.trim() || chatLoading) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  const toggleMod = (i: number) => setExpandedMods(prev => ({ ...prev, [i]: !prev[i] }))
  const toggleEntity = (i: number) => setExpandedEntities(prev => ({ ...prev, [i]: !prev[i] }))
  const toggleEndpoint = (i: number) => setExpandedEndpoints(prev => ({ ...prev, [i]: !prev[i] }))

  // Group endpoints by module
  const endpointsByModule: Record<string, Endpoint[]> = {}
  endpoints.forEach(ep => {
    const mod = ep.module ?? 'Other'
    if (!endpointsByModule[mod]) endpointsByModule[mod] = []
    endpointsByModule[mod].push(ep)
  })

  return (
    <div className="flex h-full">
      {/* Left: Plan Tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 pb-3">
          <h1 className="text-xl font-bold">{plan?.project_name ?? 'Project Plan'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{plan?.project_description ?? ''}</p>
        </div>

        <div className="flex-1 overflow-hidden px-6">
          <Tabs defaultValue="modules" className="flex flex-col h-full">
            <TabsList className="bg-secondary w-fit mb-4">
              <TabsTrigger value="modules" className="text-xs gap-1"><FiBox className="w-3 h-3" />Modules</TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1"><FiDatabase className="w-3 h-3" />Data Models</TabsTrigger>
              <TabsTrigger value="roles" className="text-xs gap-1"><FiShield className="w-3 h-3" />Roles</TabsTrigger>
              <TabsTrigger value="api" className="text-xs gap-1"><FiGlobe className="w-3 h-3" />API</TabsTrigger>
              <TabsTrigger value="workflows" className="text-xs gap-1"><FiGitBranch className="w-3 h-3" />Workflows</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pb-4">
              {/* Modules Tab */}
              <TabsContent value="modules" className="mt-0 space-y-3">
                {modules.map((mod, i) => (
                  <Card key={i} className="bg-card border-border">
                    <button onClick={() => toggleMod(i)} className="w-full text-left p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{mod.name ?? 'Module'}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.description ?? ''}</p>
                      </div>
                      {expandedMods[i] ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {expandedMods[i] && (
                      <CardContent className="pt-0 space-y-3">
                        {Array.isArray(mod.features) && mod.features.map((feat, fi) => (
                          <div key={fi} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                            <p className="text-sm font-medium">{feat.name ?? ''}</p>
                            <p className="text-xs text-muted-foreground">{feat.description ?? ''}</p>
                            {Array.isArray(feat.sub_features) && feat.sub_features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {feat.sub_features.map((sf, si) => (
                                  <Badge key={si} variant="secondary" className="text-xs">{sf}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Data Models Tab */}
              <TabsContent value="data" className="mt-0 space-y-3">
                {entities.map((entity, i) => (
                  <Card key={i} className="bg-card border-border">
                    <button onClick={() => toggleEntity(i)} className="w-full text-left p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{entity.name ?? 'Entity'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs font-mono text-primary">{entity.table_name ?? ''}</code>
                          <span className="text-xs text-muted-foreground">PK: {entity.partition_key ?? 'N/A'}</span>
                          {entity.sort_key && <span className="text-xs text-muted-foreground">SK: {entity.sort_key}</span>}
                        </div>
                      </div>
                      {expandedEntities[i] ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {expandedEntities[i] && (
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-xs text-muted-foreground">{entity.description ?? ''}</p>
                        {/* Attributes */}
                        <div>
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Attributes</p>
                          <div className="space-y-1">
                            {Array.isArray(entity.attributes) && entity.attributes.map((attr, ai) => (
                              <div key={ai} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-secondary/50">
                                <span className="font-mono font-medium w-32 truncate">{attr.name ?? ''}</span>
                                <Badge variant="secondary" className="text-xs">{attr.type ?? ''}</Badge>
                                {attr.required && <Badge className="text-xs bg-primary/20 text-primary">required</Badge>}
                                <span className="text-muted-foreground flex-1 truncate">{attr.description ?? ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* GSIs */}
                        {Array.isArray(entity.gsi) && entity.gsi.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 text-muted-foreground">Global Secondary Indexes</p>
                            <div className="space-y-1">
                              {entity.gsi.map((g, gi) => (
                                <div key={gi} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary/50">
                                  <span className="font-mono font-medium">{g.name ?? ''}</span>
                                  <span className="text-muted-foreground">PK: {g.partition_key ?? ''}</span>
                                  {g.sort_key && <span className="text-muted-foreground">SK: {g.sort_key}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Relationships */}
                        {Array.isArray(entity.relationships) && entity.relationships.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 text-muted-foreground">Relationships</p>
                            <div className="flex flex-wrap gap-2">
                              {entity.relationships.map((rel, ri) => (
                                <Badge key={ri} variant="outline" className="text-xs gap-1">
                                  {rel.type ?? ''} &rarr; {rel.target_entity ?? ''} ({rel.foreign_key ?? ''})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="mt-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roles.map((role, i) => (
                    <Card key={i} className="bg-card border-border">
                      <CardContent className="p-4 space-y-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FiShield className="w-4 h-4 text-primary" />
                          {role.name ?? 'Role'}
                        </h3>
                        <p className="text-xs text-muted-foreground">{role.description ?? ''}</p>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(role.permissions) && role.permissions.map((perm, pi) => (
                            <Badge key={pi} variant="secondary" className="text-xs">{perm}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Auth Flow */}
                {plan?.auth_flow && (
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Authentication Flow ({plan.auth_flow.provider ?? 'N/A'})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Sign Up', steps: plan.auth_flow.sign_up_flow },
                        { label: 'Sign In', steps: plan.auth_flow.sign_in_flow },
                        { label: 'Token Refresh', steps: plan.auth_flow.token_refresh },
                        { label: 'Password Reset', steps: plan.auth_flow.password_reset },
                      ].map((flow) => (
                        <div key={flow.label} className="p-2 rounded-lg bg-secondary/50">
                          <p className="text-xs font-medium mb-1">{flow.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(flow.steps) && flow.steps.map((s, si) => (
                              <span key={si} className="text-xs text-muted-foreground flex items-center gap-1">
                                {si > 0 && <span className="text-primary">&rarr;</span>}
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* API Endpoints Tab */}
              <TabsContent value="api" className="mt-0 space-y-4">
                {Object.entries(endpointsByModule).map(([modName, eps]) => (
                  <div key={modName}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{modName}</h3>
                    <div className="space-y-1">
                      {eps.map((ep, i) => {
                        const key = `${modName}-${i}`
                        const idx = endpoints.indexOf(ep)
                        return (
                          <div key={key} className="border border-border rounded-xl overflow-hidden">
                            <button onClick={() => toggleEndpoint(idx)} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
                              <MethodBadge method={ep.method ?? ''} />
                              <code className="text-xs font-mono flex-1">{ep.path ?? ''}</code>
                              {ep.auth_required ? <FiLock className="w-3 h-3 text-muted-foreground" /> : <FiUnlock className="w-3 h-3 text-muted-foreground" />}
                              {expandedEndpoints[idx] ? <FiChevronUp className="w-3 h-3 text-muted-foreground" /> : <FiChevronDown className="w-3 h-3 text-muted-foreground" />}
                            </button>
                            {expandedEndpoints[idx] && (
                              <div className="border-t border-border p-3 bg-secondary/30 space-y-2">
                                <p className="text-xs text-muted-foreground">{ep.description ?? ''}</p>
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(ep.allowed_roles) && ep.allowed_roles.map((r, ri) => (
                                    <Badge key={ri} variant="secondary" className="text-xs">{r}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Workflows Tab */}
              <TabsContent value="workflows" className="mt-0 space-y-3">
                {modules.map((mod, mi) => {
                  const wfs = Array.isArray(mod.workflows) ? mod.workflows : []
                  if (wfs.length === 0) return null
                  return (
                    <div key={mi}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{mod.name ?? 'Module'}</h3>
                      {wfs.map((wf, wi) => (
                        <Card key={wi} className="bg-card border-border mb-2">
                          <CardContent className="p-4">
                            <h4 className="text-sm font-semibold mb-3">{wf.name ?? 'Workflow'}</h4>
                            <div className="space-y-2">
                              {Array.isArray(wf.steps) && wf.steps.map((step, si) => (
                                <div key={si} className="flex items-start gap-3">
                                  <div className="flex flex-col items-center">
                                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">{si + 1}</span>
                                    {si < (wf.steps?.length ?? 0) - 1 && <div className="w-px h-4 bg-border mt-1" />}
                                  </div>
                                  <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                })}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Deploy Button */}
        <div className="p-6 pt-3 border-t border-border">
          {showDeployConfirm ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
              <span className="text-sm flex-1">Deploy this plan to production?</span>
              <Button size="sm" variant="ghost" onClick={() => setShowDeployConfirm(false)} className="gap-1"><FiX className="w-3 h-3" />Cancel</Button>
              <Button size="sm" onClick={() => { setShowDeployConfirm(false); onApproveAndDeploy() }} disabled={deploying} className="gap-1 glow-primary">
                {deploying ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheck className="w-3 h-3" />}
                Confirm Deploy
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowDeployConfirm(true)} disabled={deploying} className="w-full gap-2 glow-primary h-11">
              {deploying ? <><FiLoader className="w-4 h-4 animate-spin" />Deploying...</> : <><FiRocket className="w-4 h-4" />Approve &amp; Deploy</>}
            </Button>
          )}
        </div>
      </div>

      {/* Right: Chat Panel */}
      <div className="w-80 lg:w-96 border-l border-border flex flex-col" style={{ background: 'hsl(231 18% 12%)' }}>
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FiMessageSquare className="w-4 h-4 text-primary" />Refine Plan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Chat to adjust modules, entities, endpoints</p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary p-3 rounded-xl rounded-bl-md">
                  <FiLoader className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Suggest a change..."
              className="bg-secondary border-border text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={chatLoading}
            />
            <Button size="icon" onClick={handleSend} disabled={chatLoading || !chatInput.trim()} className="flex-shrink-0">
              <FiSend className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
