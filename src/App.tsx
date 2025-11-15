import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'
import { SettingsPanel } from '@/features/settings/components/SettingsPanel'
import { ChatScreen } from '@/features/chat/components/ChatScreen'
import { useSettingsStore } from '@/features/settings/state/settings.store'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/I18nProvider'

export default function App() {
  const providers = useSettingsStore((state) => state.providers)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const openSettings = useSettingsStore((state) => state.openSettings)
  const { t } = useI18n()

  const defaultProvider = providers.find((provider) => provider.isDefault)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {t('app.hero.kicker')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {onboardingNeeded
                ? t('app.hero.headlineConnect')
                : t('app.hero.headlineReady')}
            </h1>
            <p className="text-muted-foreground">
              {onboardingNeeded
                ? t('app.hero.descriptionConnect')
                : t('app.hero.descriptionReady', {
                    provider: defaultProvider?.displayName ?? '—',
                  })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={openSettings}
          >
            {t('app.hero.button')}
          </Button>
        </header>

        <section className="flex flex-1 flex-col gap-4">
          {onboardingNeeded ? (
            <div className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{t('app.hero.cardTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('app.hero.cardBody')}
                </p>
              </div>
              <Button
                className="mt-4 w-fit"
                onClick={openSettings}
              >
                {t('app.hero.cardCTA')}
              </Button>
            </div>
          ) : (
            <ChatScreen />
          )}
        </section>
      </main>

      <SettingsPanel />
      <OnboardingWizard />
    </div>
  )
}
