import { useSettingsStore } from '../state/settings.store'
import { ProviderForm } from './ProviderForm'
import { ProviderList } from './ProviderList'
import { Button } from '@/components/ui/button'

export function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isSettingsOpen)
  const close = useSettingsStore((state) => state.closeSettings)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)

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
            <h2 className="text-2xl font-semibold">AI providers</h2>
            <p className="text-sm text-muted-foreground">
              Connect OpenAI, Anthropic, OpenRouter or Gemini keys. Keys stay on this device.
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
      </div>
    </div>
  )
}

