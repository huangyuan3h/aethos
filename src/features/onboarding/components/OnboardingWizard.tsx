import { useMemo, useState } from 'react'

import { usePreferencesStore } from '@/features/preferences/state/preferences.store'
import { useOnboardingStore } from '@/features/onboarding/state/onboarding.store'
import { useSettingsStore } from '@/features/settings/state/settings.store'
import { ProviderForm } from '@/features/settings/components/ProviderForm'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'fr-FR', label: 'Français' },
] as const

export function OnboardingWizard() {
  const isOpen = useOnboardingStore((state) => state.isOpen)
  const close = useOnboardingStore((state) => state.close)
  const savePreferences = usePreferencesStore((state) => state.savePreferences)
  const preferencesLoaded = usePreferencesStore((state) => state.isLoaded)
  const settingsLoaded = useSettingsStore((state) => state.isLoaded)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const needsPreferences = usePreferencesStore((state) => state.needsSetup)

  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState<'en' | 'zh-CN' | 'fr-FR'>('en')
  const builtinThemes = usePreferencesStore((state) => state.builtinThemes)
  const customThemes = usePreferencesStore((state) => state.customThemes)
  const activeThemeId = usePreferencesStore((state) => state.activeThemeId)
  const setActiveTheme = usePreferencesStore((state) => state.setActiveTheme)
  const applyLanguage = usePreferencesStore((state) => state.applyLanguage)
  const themeOptions = useMemo(() => [...builtinThemes, ...customThemes], [builtinThemes, customThemes])
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(undefined)
  const resolvedThemeId = selectedThemeId ?? activeThemeId ?? themeOptions[0]?.id

  if (!isOpen) {
    return null
  }

  const handlePreferencesComplete = async () => {
    await savePreferences({
      language,
    })
    if (resolvedThemeId) {
      await setActiveTheme(resolvedThemeId)
    }
  }

  const handleFinish = async () => {
    await handlePreferencesComplete()
    close()
  }

  const canClose = preferencesLoaded && settingsLoaded && !onboardingNeeded && !needsPreferences

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-6 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Welcome
        </p>
        <h1 className="text-3xl font-semibold">Let's personalize Aethos</h1>
        <p className="text-sm text-muted-foreground">
          Choose your language, theme and connect the first AI provider. Keys永远保存在本地。
        </p>

        <div className="mt-6 flex gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className={step === 0 ? 'text-primary' : undefined}>Language</span>
          <span>•</span>
          <span className={step === 1 ? 'text-primary' : undefined}>Theme</span>
          <span>•</span>
          <span className={step === 2 ? 'text-primary' : undefined}>AI Provider</span>
        </div>

        {step === 0 ? (
          <StepContainer
            title="Choose your language"
            description="This controls the interface language. You can change it later in settings."
          >
            <div className="grid grid-cols-2 gap-4">
              {LANGUAGES.map((option) => (
                <button
                  key={option.code}
                  className={`rounded-2xl border p-4 text-left ${language === option.code ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onClick={() => {
                    setLanguage(option.code)
                    applyLanguage(option.code)
                  }}
                >
                  <p className="text-lg font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.code}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)}>Next</Button>
            </div>
          </StepContainer>
        ) : null}

        {step === 1 ? (
          <StepContainer
            title="Select a theme"
            description="Pick the default look and feel. You can switch later."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition',
                    resolvedThemeId === option.id ? 'border-primary bg-primary/10' : 'border-border',
                  )}
                  onClick={() => {
                    setSelectedThemeId(option.id)
                    void setActiveTheme(option.id)
                  }}
                >
                  <p className="text-lg font-semibold">{option.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.mode === 'dark' ? 'Dark' : 'Light'}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(0)}
              >
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </StepContainer>
        ) : null}

        {step === 2 ? (
          <StepContainer
            title="Connect an AI provider"
            description="Add at least one API key to start chatting."
          >
            <ProviderForm
              onSuccess={handleFinish}
              variant="compact"
            />
            {canClose ? (
              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={close}
              >
                Skip for now
              </Button>
            ) : null}
          </StepContainer>
        ) : null}
      </div>
    </div>
  )
}

function StepContainer({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

