import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'
import { SettingsPanel } from '@/features/settings/components/SettingsPanel'
import { useSettingsStore } from '@/features/settings/state/settings.store'
import { Button } from '@/components/ui/button'

export default function App() {
  const providers = useSettingsStore((state) => state.providers)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const openSettings = useSettingsStore((state) => state.openSettings)

  const defaultProvider = providers.find((provider) => provider.isDefault)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Aethos / Personal AI Workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {onboardingNeeded ? 'Connect an AI provider' : 'Workspace is ready'}
            </h1>
            <p className="text-muted-foreground">
              {onboardingNeeded
                ? 'Bring your own API key to unlock conversations and workflows.'
                : `Default provider: ${defaultProvider?.displayName ?? '—'}.`}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={openSettings}
          >
            Manage providers
          </Button>
        </header>

        <section className="flex flex-1 flex-col gap-4 rounded-2xl border bg-card/50 p-6 backdrop-blur">
          {onboardingNeeded ? (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">You're almost there</h2>
                <p className="text-sm text-muted-foreground">
                  Add at least one API key (OpenAI, OpenRouter, Anthropic, Gemini) to begin chatting
                  and calling MCP tools.
                </p>
              </div>
              <Button
                className="w-fit"
                onClick={openSettings}
              >
                Configure provider
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Next steps</h2>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>Finish chat engine wiring + secure key routing.</li>
                <li>Connect MCP servers and schedule background tasks.</li>
                <li>Design the multi-pane conversation interface.</li>
              </ul>
            </>
          )}
        </section>
      </main>

      <SettingsPanel />
      <OnboardingWizard />
    </div>
  )
}
