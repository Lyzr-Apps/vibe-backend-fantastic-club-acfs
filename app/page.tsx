'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Sidebar from './sections/Sidebar'
import Dashboard from './sections/Dashboard'
import IdeaInput from './sections/IdeaInput'
import PlanReview from './sections/PlanReview'
import DeploymentDetails from './sections/DeploymentDetails'
import { FiCpu, FiZap } from 'react-icons/fi'

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'idea-input' | 'plan-review' | 'deployment-details'

interface Feature { name: string; description: string; sub_features: string[] }
interface Workflow { name: string; steps: string[] }
interface Module { name: string; description: string; features: Feature[]; workflows: Workflow[] }
interface Attribute { name: string; type: string; required: boolean; description: string }
interface GSI { name: string; partition_key: string; sort_key: string }
interface Relationship { target_entity: string; type: string; foreign_key: string }
interface Entity { name: string; description: string; table_name: string; partition_key: string; sort_key: string; attributes: Attribute[]; gsi: GSI[]; relationships: Relationship[] }
interface Endpoint { module: string; method: string; path: string; description: string; auth_required: boolean; allowed_roles: string[] }
interface Role { name: string; description: string; permissions: string[] }
interface AuthFlow { provider: string; sign_up_flow: string[]; sign_in_flow: string[]; token_refresh: string[]; password_reset: string[] }
interface PlanData { project_name: string; project_description: string; modules: Module[]; entities: Entity[]; endpoints: Endpoint[]; roles: Role[]; auth_flow: AuthFlow }
interface DeployEndpoint { method: string; path: string; full_url: string; description: string; curl_command: string }
interface AuthDetails { user_pool_id: string; client_id: string; token_endpoint: string; sample_auth_curl: string }
interface Infrastructure { lambda_functions: string[]; dynamodb_tables: string[]; api_gateway: string; cognito_pool: string }
interface DeploymentData { deployment_status: string; base_url: string; region: string; api_endpoints: DeployEndpoint[]; auth_details: AuthDetails; infrastructure: Infrastructure; terraform_summary: string; quick_start_guide: string[] }
interface Project { id: string; name: string; description: string; status: 'draft' | 'deployed' | 'failed'; createdAt: string; plan?: PlanData; deployment?: DeploymentData }
interface ChatMessage { role: 'user' | 'assistant'; content: string }

// ─── Agent IDs ──────────────────────────────────────────────────────────────

const PLAN_ARCHITECT_ID = '69a531a2601bdd4db8d93a0b'
const REFINEMENT_AGENT_ID = '69a531c8a7fbf6e11e247c59'
const DEPLOYMENT_ENGINE_ID = '69a531c963f3fb9893f89e47'

// ─── Sample Data ────────────────────────────────────────────────────────────

const SAMPLE_PLAN: PlanData = {
  project_name: 'SchoolSync',
  project_description: 'A comprehensive school management system with student enrollment, grade tracking, attendance, and parent communication.',
  modules: [
    { name: 'Student Management', description: 'Handle student enrollment, profiles, and records', features: [{ name: 'Enrollment', description: 'Student registration and admission', sub_features: ['Online application', 'Document upload', 'Approval workflow'] }, { name: 'Profiles', description: 'Student profile management', sub_features: ['Academic history', 'Contact info'] }], workflows: [{ name: 'Enrollment Flow', steps: ['Submit application', 'Admin review', 'Approve/Reject', 'Create student record'] }] },
    { name: 'Grade Tracking', description: 'Manage courses, assignments, and grades', features: [{ name: 'Gradebook', description: 'Grade entry and calculation', sub_features: ['Weighted grades', 'GPA calc'] }], workflows: [{ name: 'Grade Entry', steps: ['Teacher enters grades', 'System calculates averages', 'Notify parents'] }] },
    { name: 'Attendance', description: 'Daily attendance tracking and reporting', features: [{ name: 'Daily Check-in', description: 'Mark attendance per class', sub_features: ['QR code scan', 'Manual entry'] }], workflows: [] },
  ],
  entities: [
    { name: 'Student', description: 'Student record', table_name: 'students', partition_key: 'student_id', sort_key: 'enrollment_date', attributes: [{ name: 'student_id', type: 'String', required: true, description: 'Unique student ID' }, { name: 'full_name', type: 'String', required: true, description: 'Student full name' }, { name: 'email', type: 'String', required: true, description: 'Student email' }, { name: 'grade_level', type: 'Number', required: true, description: 'Current grade level' }], gsi: [{ name: 'grade-index', partition_key: 'grade_level', sort_key: 'full_name' }], relationships: [{ target_entity: 'Enrollment', type: '1:N', foreign_key: 'student_id' }] },
    { name: 'Course', description: 'Course catalog entry', table_name: 'courses', partition_key: 'course_id', sort_key: 'semester', attributes: [{ name: 'course_id', type: 'String', required: true, description: 'Course ID' }, { name: 'title', type: 'String', required: true, description: 'Course title' }, { name: 'teacher_id', type: 'String', required: true, description: 'Assigned teacher' }], gsi: [], relationships: [{ target_entity: 'Student', type: 'M:N', foreign_key: 'enrollment' }] },
  ],
  endpoints: [
    { module: 'Student Management', method: 'POST', path: '/api/students', description: 'Create student', auth_required: true, allowed_roles: ['admin'] },
    { module: 'Student Management', method: 'GET', path: '/api/students', description: 'List students', auth_required: true, allowed_roles: ['admin', 'teacher'] },
    { module: 'Student Management', method: 'GET', path: '/api/students/{id}', description: 'Get student by ID', auth_required: true, allowed_roles: ['admin', 'teacher', 'parent'] },
    { module: 'Grade Tracking', method: 'POST', path: '/api/grades', description: 'Submit grade', auth_required: true, allowed_roles: ['teacher'] },
    { module: 'Grade Tracking', method: 'GET', path: '/api/grades/{student_id}', description: 'Get grades for student', auth_required: true, allowed_roles: ['admin', 'teacher', 'parent', 'student'] },
    { module: 'Attendance', method: 'POST', path: '/api/attendance', description: 'Mark attendance', auth_required: true, allowed_roles: ['teacher'] },
    { module: 'Attendance', method: 'GET', path: '/api/attendance/{student_id}', description: 'Get attendance record', auth_required: true, allowed_roles: ['admin', 'teacher', 'parent'] },
  ],
  roles: [
    { name: 'admin', description: 'Full system access', permissions: ['manage_students', 'manage_courses', 'manage_grades', 'manage_attendance', 'manage_users'] },
    { name: 'teacher', description: 'Class management and grading', permissions: ['view_students', 'manage_grades', 'manage_attendance'] },
    { name: 'parent', description: 'View child information', permissions: ['view_student', 'view_grades', 'view_attendance'] },
    { name: 'student', description: 'View own records', permissions: ['view_own_grades', 'view_own_attendance'] },
  ],
  auth_flow: { provider: 'AWS Cognito', sign_up_flow: ['Enter email + password', 'Verify email via OTP', 'Admin assigns role'], sign_in_flow: ['Enter credentials', 'Receive JWT tokens', 'Access resources'], token_refresh: ['Submit refresh token', 'Receive new access token'], password_reset: ['Request reset link', 'Enter new password', 'Confirm via email'] },
}

const SAMPLE_DEPLOYMENT: DeploymentData = {
  deployment_status: 'SUCCESS',
  base_url: 'https://api.schoolsync.example.com',
  region: 'us-east-1',
  api_endpoints: [
    { method: 'POST', path: '/api/students', full_url: 'https://api.schoolsync.example.com/api/students', description: 'Create student', curl_command: "curl -X POST https://api.schoolsync.example.com/api/students -H 'Authorization: Bearer TOKEN' -d '{\"name\":\"Jane\"}'" },
    { method: 'GET', path: '/api/students', full_url: 'https://api.schoolsync.example.com/api/students', description: 'List students', curl_command: "curl https://api.schoolsync.example.com/api/students -H 'Authorization: Bearer TOKEN'" },
    { method: 'POST', path: '/api/grades', full_url: 'https://api.schoolsync.example.com/api/grades', description: 'Submit grade', curl_command: "curl -X POST https://api.schoolsync.example.com/api/grades -H 'Authorization: Bearer TOKEN' -d '{\"student_id\":\"S001\",\"grade\":\"A\"}'" },
  ],
  auth_details: { user_pool_id: 'us-east-1_AbC123dEf', client_id: '7abc123def456ghi789', token_endpoint: 'https://schoolsync.auth.us-east-1.amazoncognito.com/oauth2/token', sample_auth_curl: "curl -X POST https://schoolsync.auth.us-east-1.amazoncognito.com/oauth2/token -d 'grant_type=client_credentials&client_id=7abc123def456ghi789'" },
  infrastructure: { lambda_functions: ['createStudent', 'getStudents', 'getStudentById', 'submitGrade', 'getGrades', 'markAttendance', 'getAttendance'], dynamodb_tables: ['students', 'courses', 'grades', 'attendance'], api_gateway: 'schoolsync-api-gw', cognito_pool: 'schoolsync-user-pool' },
  terraform_summary: 'Created 7 Lambda functions, 4 DynamoDB tables, 1 API Gateway, 1 Cognito User Pool with 4 roles.',
  quick_start_guide: ['Sign up at the Cognito hosted UI', 'Obtain your JWT access token', 'Use the token in Authorization header for API calls', 'Start with POST /api/students to create your first student record', 'Explore other endpoints in the documentation above'],
}

const SAMPLE_PROJECTS: Project[] = [
  { id: '1', name: 'SchoolSync', description: 'A comprehensive school management system with student enrollment, grade tracking, attendance, and parent communication.', status: 'deployed', createdAt: '2025-01-15', plan: SAMPLE_PLAN, deployment: SAMPLE_DEPLOYMENT },
  { id: '2', name: 'InventoryHub', description: 'Real-time inventory tracking with warehouse management and supplier integration.', status: 'draft', createdAt: '2025-02-01' },
]

// ─── Error Boundary ─────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Agents Info ────────────────────────────────────────────────────────────

const AGENTS = [
  { id: PLAN_ARCHITECT_ID, name: 'Plan Architect', purpose: 'Orchestrates full backend plan generation' },
  { id: '69a53158227dc30e21e15f4c', name: 'Module Designer', purpose: 'Designs modules and features' },
  { id: '69a53159b9d55abdea083b24', name: 'Data Architect', purpose: 'Creates data models and schemas' },
  { id: '69a5315996e0e3e22def7926', name: 'API Designer', purpose: 'Designs APIs and auth flows' },
  { id: REFINEMENT_AGENT_ID, name: 'Refinement', purpose: 'Iterative plan adjustments via chat' },
  { id: DEPLOYMENT_ENGINE_ID, name: 'Deploy Engine', purpose: 'Generates code and deploys infra' },
]

// ─── Helper ─────────────────────────────────────────────────────────────────

function parseData(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return parseLLMJson(raw) as Record<string, unknown> } catch { return {} }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>
  return {}
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayProjects = sampleMode ? SAMPLE_PROJECTS : projects

  const handleGeneratePlan = useCallback(async (idea: string, complexity: string) => {
    setLoading(true)
    setError(null)
    setActiveAgentId(PLAN_ARCHITECT_ID)
    try {
      const message = `Build a ${complexity} backend for: ${idea}`
      const result = await callAIAgent(message, PLAN_ARCHITECT_ID)
      if (result.success) {
        const data = parseData(result?.response?.result)
        const plan: PlanData = {
          project_name: (data.project_name as string) ?? idea.slice(0, 40),
          project_description: (data.project_description as string) ?? idea,
          modules: Array.isArray(data.modules) ? data.modules as Module[] : [],
          entities: Array.isArray(data.entities) ? data.entities as Entity[] : [],
          endpoints: Array.isArray(data.endpoints) ? data.endpoints as Endpoint[] : [],
          roles: Array.isArray(data.roles) ? data.roles as Role[] : [],
          auth_flow: (data.auth_flow as AuthFlow) ?? { provider: '', sign_up_flow: [], sign_in_flow: [], token_refresh: [], password_reset: [] },
        }
        const project: Project = {
          id: Date.now().toString(),
          name: plan.project_name,
          description: plan.project_description,
          status: 'draft',
          createdAt: new Date().toLocaleDateString(),
          plan,
        }
        setCurrentProject(project)
        setProjects(prev => [...prev, project])
        setChatMessages([])
        setCurrentScreen('plan-review')
      } else {
        setError('Failed to generate plan. Please try again.')
      }
    } catch {
      setError('An error occurred while generating the plan.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleChatMessage = useCallback(async (userMessage: string) => {
    if (!currentProject?.plan) return
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)
    setActiveAgentId(REFINEMENT_AGENT_ID)
    try {
      const contextMsg = `Current plan: ${JSON.stringify(currentProject.plan)}\n\nUser request: ${userMessage}`
      const result = await callAIAgent(contextMsg, REFINEMENT_AGENT_ID)
      if (result.success) {
        const data = parseData(result?.response?.result)
        const reply = (data.message as string) ?? 'Plan updated.'
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
        const updatedPlan = { ...currentProject.plan }
        if (Array.isArray(data.updated_modules) && data.updated_modules.length > 0) {
          updatedPlan.modules = data.updated_modules as Module[]
        }
        if (Array.isArray(data.updated_entities) && data.updated_entities.length > 0) {
          updatedPlan.entities = data.updated_entities as Entity[]
        }
        if (Array.isArray(data.updated_endpoints) && data.updated_endpoints.length > 0) {
          updatedPlan.endpoints = data.updated_endpoints as Endpoint[]
        }
        if (Array.isArray(data.updated_roles) && data.updated_roles.length > 0) {
          updatedPlan.roles = data.updated_roles as Role[]
        }
        setCurrentProject(prev => prev ? { ...prev, plan: updatedPlan } : prev)
        setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, plan: updatedPlan } : p))
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Could not process your request. Please try again.' }])
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }, [currentProject])

  const handleDeploy = useCallback(async () => {
    if (!currentProject?.plan) return
    setDeploying(true)
    setError(null)
    setActiveAgentId(DEPLOYMENT_ENGINE_ID)
    try {
      const message = `Deploy this plan: ${JSON.stringify(currentProject.plan)}`
      const result = await callAIAgent(message, DEPLOYMENT_ENGINE_ID)
      if (result.success) {
        const data = parseData(result?.response?.result)
        const deployment: DeploymentData = {
          deployment_status: (data.deployment_status as string) ?? 'COMPLETE',
          base_url: (data.base_url as string) ?? '',
          region: (data.region as string) ?? '',
          api_endpoints: Array.isArray(data.api_endpoints) ? data.api_endpoints as DeployEndpoint[] : [],
          auth_details: (data.auth_details as AuthDetails) ?? { user_pool_id: '', client_id: '', token_endpoint: '', sample_auth_curl: '' },
          infrastructure: (data.infrastructure as Infrastructure) ?? { lambda_functions: [], dynamodb_tables: [], api_gateway: '', cognito_pool: '' },
          terraform_summary: (data.terraform_summary as string) ?? '',
          quick_start_guide: Array.isArray(data.quick_start_guide) ? data.quick_start_guide as string[] : [],
        }
        const updated: Project = { ...currentProject, status: 'deployed', deployment }
        setCurrentProject(updated)
        setProjects(prev => prev.map(p => p.id === currentProject.id ? updated : p))
        setCurrentScreen('deployment-details')
      } else {
        setError('Deployment failed. Please try again.')
        setCurrentProject(prev => prev ? { ...prev, status: 'failed' } : prev)
      }
    } catch {
      setError('An error occurred during deployment.')
    } finally {
      setDeploying(false)
      setActiveAgentId(null)
    }
  }, [currentProject])

  const handleSelectProject = useCallback((id: string) => {
    const allProjs = sampleMode ? SAMPLE_PROJECTS : projects
    const proj = allProjs.find(p => p.id === id)
    if (!proj) return
    setCurrentProject(proj)
    setChatMessages([])
    if (proj.deployment) setCurrentScreen('deployment-details')
    else if (proj.plan) setCurrentScreen('plan-review')
    else setCurrentScreen('idea-input')
  }, [projects, sampleMode])

  const handleUpdatePlan = useCallback((plan: PlanData) => {
    if (!currentProject) return
    setCurrentProject(prev => prev ? { ...prev, plan } : prev)
    setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, plan } : p))
  }, [currentProject])

  const displayPlan = sampleMode && currentScreen === 'plan-review' && !currentProject?.plan ? SAMPLE_PLAN : currentProject?.plan
  const displayDeployment = sampleMode && currentScreen === 'deployment-details' && !currentProject?.deployment ? SAMPLE_DEPLOYMENT : currentProject?.deployment
  const displayProjectName = currentProject?.name ?? displayPlan?.project_name ?? 'Project'

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            if (screen === 'idea-input') { setCurrentProject(null); setChatMessages([]) }
            setCurrentScreen(screen)
          }}
          projectCount={displayProjects.length}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <FiZap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium capitalize">{currentScreen.replace(/-/g, ' ')}</span>
              {activeAgentId && (
                <Badge variant="secondary" className="text-xs animate-pulse gap-1">
                  <FiCpu className="w-3 h-3" />
                  {AGENTS.find(a => a.id === activeAgentId)?.name ?? 'Processing'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-destructive">{error}</span>}
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {currentScreen === 'dashboard' && (
              <Dashboard
                projects={displayProjects}
                onNewProject={() => { setCurrentProject(null); setChatMessages([]); setCurrentScreen('idea-input') }}
                onSelectProject={handleSelectProject}
              />
            )}
            {currentScreen === 'idea-input' && (
              <IdeaInput onGeneratePlan={handleGeneratePlan} loading={loading} />
            )}
            {currentScreen === 'plan-review' && displayPlan && (
              <PlanReview
                plan={displayPlan}
                onUpdatePlan={handleUpdatePlan}
                onApproveAndDeploy={handleDeploy}
                deploying={deploying}
                chatMessages={chatMessages}
                onSendMessage={handleChatMessage}
                chatLoading={chatLoading}
              />
            )}
            {currentScreen === 'deployment-details' && displayDeployment && (
              <DeploymentDetails
                deployment={displayDeployment}
                projectName={displayProjectName}
                onBackToDashboard={() => setCurrentScreen('dashboard')}
              />
            )}
          </main>
          <footer className="px-6 py-2 border-t border-border bg-card/30">
            <div className="flex items-center gap-4 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Agents:</span>
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-1.5 whitespace-nowrap" title={agent.purpose}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeAgentId === agent.id ? 'bg-accent animate-pulse' : 'bg-muted-foreground/40'}`} />
                  <span className={`text-xs ${activeAgentId === agent.id ? 'text-accent font-medium' : 'text-muted-foreground'}`}>{agent.name}</span>
                </div>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  )
}
