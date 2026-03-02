'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { FiGrid, FiPlus, FiFolder, FiSettings, FiMenu, FiX, FiZap } from 'react-icons/fi'

type Screen = 'dashboard' | 'idea-input' | 'plan-review' | 'deployment-details'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  projectCount: number
}

const navItems: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: <FiGrid className="w-5 h-5" /> },
  { screen: 'idea-input', label: 'New Project', icon: <FiPlus className="w-5 h-5" /> },
]

export default function Sidebar({ collapsed, onToggle, currentScreen, onNavigate, projectCount }: SidebarProps) {
  return (
    <div
      className={`flex flex-col h-screen border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
      style={{ background: 'hsl(231 18% 12%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <FiZap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">CloudForge</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <FiMenu className="w-5 h-5" /> : <FiX className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary/15 text-primary glow-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}

        {/* Projects History */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary`}
          title={collapsed ? 'Projects' : undefined}
        >
          <FiFolder className="w-5 h-5" />
          {!collapsed && (
            <span className="flex-1 flex items-center justify-between">
              Projects
              {projectCount > 0 && (
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{projectCount}</span>
              )}
            </span>
          )}
        </button>

        {/* Settings placeholder */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          title={collapsed ? 'Settings' : undefined}
        >
          <FiSettings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Powered by Lyzr</p>
        </div>
      )}
    </div>
  )
}
