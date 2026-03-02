'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { copyToClipboard } from '@/lib/clipboard'
import { FiCheckCircle, FiCopy, FiCheck, FiExternalLink, FiArrowLeft, FiDownload, FiServer, FiDatabase, FiShield, FiGlobe, FiChevronDown, FiChevronUp } from 'react-icons/fi'

interface DeployEndpoint {
  method: string
  path: string
  full_url: string
  description: string
  curl_command: string
}

interface AuthDetails {
  user_pool_id: string
  client_id: string
  token_endpoint: string
  sample_auth_curl: string
}

interface Infrastructure {
  lambda_functions: string[]
  dynamodb_tables: string[]
  api_gateway: string
  cognito_pool: string
}

interface DeploymentData {
  deployment_status: string
  base_url: string
  region: string
  api_endpoints: DeployEndpoint[]
  auth_details: AuthDetails
  infrastructure: Infrastructure
  terraform_summary: string
  quick_start_guide: string[]
}

interface DeploymentDetailsProps {
  deployment: DeploymentData
  projectName: string
  onBackToDashboard: () => void
}

function MethodBadge({ method }: { method: string }) {
  const m = (method ?? '').toUpperCase()
  const cls: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    DELETE: 'method-delete',
  }
  return (
    <span className={`font-mono text-xs font-bold ${cls[m] ?? 'text-muted-foreground'}`}>
      {m}
    </span>
  )
}

export default function DeploymentDetails({ deployment, projectName, onBackToDashboard }: DeploymentDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(null)
  const [showAuthCurl, setShowAuthCurl] = useState(false)

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const endpoints = Array.isArray(deployment?.api_endpoints) ? deployment.api_endpoints : []
  const lambdas = Array.isArray(deployment?.infrastructure?.lambda_functions) ? deployment.infrastructure.lambda_functions : []
  const tables = Array.isArray(deployment?.infrastructure?.dynamodb_tables) ? deployment.infrastructure.dynamodb_tables : []
  const quickStart = Array.isArray(deployment?.quick_start_guide) ? deployment.quick_start_guide : []

  const handleDownloadConfig = () => {
    const config = JSON.stringify(deployment, null, 2)
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName?.replace(/\s+/g, '_') ?? 'project'}_deployment.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAllEndpoints = async () => {
    const text = endpoints.map(ep => `${(ep.method ?? '').toUpperCase()} ${ep.full_url ?? ep.path ?? ''}`).join('\n')
    await handleCopy(text, 'all-endpoints')
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <button onClick={onBackToDashboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Success Banner */}
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center glow-accent">
              <FiCheckCircle className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{projectName} deployed successfully</h2>
              <p className="text-sm text-muted-foreground">
                Status: {deployment?.deployment_status ?? 'Complete'} | Region: {deployment?.region ?? 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Base URL */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiGlobe className="w-4 h-4 text-primary" />Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <code className="flex-1 text-sm font-mono text-accent">{deployment?.base_url ?? 'N/A'}</code>
              <button onClick={() => handleCopy(deployment?.base_url ?? '', 'base-url')} className="p-2 rounded-md hover:bg-muted transition-colors">
                {copied === 'base-url' ? <FiCheck className="w-4 h-4 text-accent" /> : <FiCopy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FiServer className="w-4 h-4 text-primary" />API Endpoints ({endpoints.length})</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleCopyAllEndpoints}>
              {copied === 'all-endpoints' ? <FiCheck className="w-3 h-3 mr-1" /> : <FiCopy className="w-3 h-3 mr-1" />}
              Copy All
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {endpoints.map((ep, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExpandedEndpoint(expandedEndpoint === i ? null : i)} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
                  <MethodBadge method={ep.method ?? ''} />
                  <code className="text-sm font-mono flex-1">{ep.path ?? ''}</code>
                  <span className="text-xs text-muted-foreground hidden md:inline">{ep.description ?? ''}</span>
                  {expandedEndpoint === i ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedEndpoint === i && (
                  <div className="border-t border-border p-3 space-y-2 bg-secondary/30">
                    <p className="text-sm text-muted-foreground">{ep.description ?? ''}</p>
                    {ep.full_url && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">URL:</span>
                        <code className="text-xs font-mono text-accent">{ep.full_url}</code>
                        <button onClick={() => handleCopy(ep.full_url, `url-${i}`)} className="p-1 rounded hover:bg-muted">
                          {copied === `url-${i}` ? <FiCheck className="w-3 h-3 text-accent" /> : <FiCopy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                    )}
                    {ep.curl_command && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">cURL:</span>
                        <div className="code-block p-3 text-xs font-mono overflow-x-auto relative">
                          <pre className="whitespace-pre-wrap text-foreground">{ep.curl_command}</pre>
                          <button onClick={() => handleCopy(ep.curl_command, `curl-${i}`)} className="absolute top-2 right-2 p-1 rounded hover:bg-muted">
                            {copied === `curl-${i}` ? <FiCheck className="w-3 h-3 text-accent" /> : <FiCopy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Auth Details */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiShield className="w-4 h-4 text-primary" />Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'User Pool ID', value: deployment?.auth_details?.user_pool_id },
                { label: 'Client ID', value: deployment?.auth_details?.client_id },
                { label: 'Token Endpoint', value: deployment?.auth_details?.token_endpoint },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-secondary space-y-1">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground truncate flex-1">{item.value ?? 'N/A'}</code>
                    <button onClick={() => handleCopy(item.value ?? '', item.label)} className="p-1 rounded hover:bg-muted flex-shrink-0">
                      {copied === item.label ? <FiCheck className="w-3 h-3 text-accent" /> : <FiCopy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {deployment?.auth_details?.sample_auth_curl && (
              <div>
                <button onClick={() => setShowAuthCurl(!showAuthCurl)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  {showAuthCurl ? 'Hide' : 'Show'} sample auth cURL
                  {showAuthCurl ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                </button>
                {showAuthCurl && (
                  <div className="code-block p-3 mt-2 text-xs font-mono overflow-x-auto relative">
                    <pre className="whitespace-pre-wrap text-foreground">{deployment.auth_details.sample_auth_curl}</pre>
                    <button onClick={() => handleCopy(deployment.auth_details.sample_auth_curl, 'auth-curl')} className="absolute top-2 right-2 p-1 rounded hover:bg-muted">
                      {copied === 'auth-curl' ? <FiCheck className="w-3 h-3 text-accent" /> : <FiCopy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Infrastructure */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FiDatabase className="w-4 h-4 text-primary" />Infrastructure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Lambda Functions ({lambdas.length})</p>
                <div className="space-y-1">
                  {lambdas.map((fn, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="font-mono">{fn}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">DynamoDB Tables ({tables.length})</p>
                <div className="space-y-1">
                  {tables.map((tbl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-mono">{tbl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {deployment?.infrastructure?.api_gateway && (
                <div className="p-3 rounded-lg bg-secondary">
                  <span className="text-xs text-muted-foreground">API Gateway</span>
                  <p className="text-sm font-mono">{deployment.infrastructure.api_gateway}</p>
                </div>
              )}
              {deployment?.infrastructure?.cognito_pool && (
                <div className="p-3 rounded-lg bg-secondary">
                  <span className="text-xs text-muted-foreground">Cognito Pool</span>
                  <p className="text-sm font-mono">{deployment.infrastructure.cognito_pool}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terraform Summary */}
        {deployment?.terraform_summary && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Terraform Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="code-block p-4 text-xs font-mono whitespace-pre-wrap">{deployment.terraform_summary}</div>
            </CardContent>
          </Card>
        )}

        {/* Quick Start */}
        {quickStart.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {quickStart.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleCopyAllEndpoints} className="gap-2">
            <FiCopy className="w-4 h-4" />
            Copy All Endpoints
          </Button>
          <Button variant="outline" onClick={handleDownloadConfig} className="gap-2">
            <FiDownload className="w-4 h-4" />
            Download Config
          </Button>
          <Button onClick={onBackToDashboard} className="gap-2">
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
