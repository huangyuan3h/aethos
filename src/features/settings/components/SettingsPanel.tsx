import { useState } from 'react'

import { useSettingsStore } from '../state/settings.store'
import { ProviderForm } from './ProviderForm'
import { ProviderList } from './ProviderList'
import { Button } from '@/components/ui/button'
import { McpSettings } from '@/features/mcp/components/McpSettings'

export function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isSettingsOpen)
  const close = useSettingsStore((state) => state.closeSettings)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const [view, setView] = useState<'providers' | 'mcp'>('providers')

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 p-4 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Settings
            </p>
            <h2 className="text-2xl font-semibold">
              {view === 'providers' ? 'AI providers' : 'Model Context Protocol'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {view === 'providers'
                ? 'Connect OpenAI, Anthropic, OpenRouter or Gemini keys. Keys stay on this device.'
                : 'Configure MCP sources and installed servers for advanced workflows.'}
            </p>
          </div>
          {!onboardingNeeded ? (
            <Button
              variant="ghost"
              onClick={close}
            >
              Close
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant={view === 'providers' ? 'default' : 'ghost'}
            onClick={() => setView('providers')}
          >
            Providers
          </Button>
            <Button
              variant={view === 'mcp' ? 'default' : 'ghost'}
              onClick={() => setView('mcp')}
            >
              MCP
            </Button>
        </div>

        {view === 'providers' ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Add provider
              </h3>
              <ProviderForm />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Connected
              </h3>
              <ProviderList />
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <McpSettings />
          </div>
        )}
      </div>
    </div>
  )
}

