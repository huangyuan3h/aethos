import { useState } from 'react'

import { useSettingsStore } from '../state/settings.store'
import { ProviderForm } from './ProviderForm'
import { ProviderList } from './ProviderList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { McpSettings } from '@/features/mcp/components/McpSettings'
import { cn } from '@/lib/utils'
import { GeneralSettings } from './GeneralSettings'

export function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isSettingsOpen)
  const close = useSettingsStore((state) => state.closeSettings)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const sections: Array<{ id: SettingsSection; label: string; description: string }> = [
    { id: 'general', label: 'General', description: 'App-wide defaults & behavior' },
    { id: 'theme', label: 'Theme', description: 'Appearance & typography' },
    { id: 'providers', label: 'Providers', description: 'AI provider credentials' },
    { id: 'mcp', label: 'MCP', description: 'Model Context Protocol servers' },
  ]
  const [view, setView] = useState<SettingsSection>('providers')

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 px-6 py-8 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-6xl gap-8 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-2xl">
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border/60 pr-4">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Settings
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Workspace</h2>
            </div>
            <nav className="mt-6 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setView(section.id)}
                  className={cn(
                    'w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm transition',
                    view === section.id
                      ? 'border-primary/40 bg-primary/10 text-primary-foreground'
                      : 'hover:border-border/80 hover:bg-card',
                  )}
                >
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </button>
              ))}
            </nav>
          </div>
          {!onboardingNeeded ? (
            <Button
              variant="ghost"
              onClick={close}
            >
              Close
            </Button>
          ) : null}
        </aside>

        <section className="flex-1 overflow-y-auto">
          {view === 'general' ? (
            <GeneralSettings />
          ) : view === 'theme' ? (
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Control color scheme and typography.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Theme customization will be available in a future update.
                </p>
              </CardContent>
            </Card>
          ) : view === 'providers' ? (
            <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Add provider</CardTitle>
                  <CardDescription>
                    Save OpenAI, OpenRouter, Anthropic or other compatible keys with encryption.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderForm />
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Connected providers</CardTitle>
                  <CardDescription>
                    Choose a default model or remove providers you no longer need.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderList />
                </CardContent>
              </Card>
            </div>
          ) : (
            <McpSettings />
          )}
        </section>
      </div>
    </div>
  )
}

type SettingsSection = 'general' | 'theme' | 'providers' | 'mcp'

