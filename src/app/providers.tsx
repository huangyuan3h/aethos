import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useOnboardingStore } from '@/features/onboarding/state/onboarding.store'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'
import { useSettingsStore } from '@/features/settings/state/settings.store'
import { I18nProvider } from '@/i18n/I18nProvider'

export function AppProviders({ children }: PropsWithChildren) {
  const fetchProviders = useSettingsStore((state) => state.fetchProviders)
  const fetchPreferences = usePreferencesStore((state) => state.fetchPreferences)
  const settingsLoaded = useSettingsStore((state) => state.isLoaded)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const preferencesLoaded = usePreferencesStore((state) => state.isLoaded)
  const needsPreferences = usePreferencesStore((state) => state.needsSetup)
  const openOnboarding = useOnboardingStore((state) => state.open)
  const closeOnboarding = useOnboardingStore((state) => state.close)

  useEffect(() => {
    void fetchPreferences()
    void fetchProviders()
  }, [fetchProviders, fetchPreferences])

  useEffect(() => {
    if (settingsLoaded && preferencesLoaded) {
      if (onboardingNeeded || needsPreferences) {
        openOnboarding()
      } else {
        closeOnboarding()
      }
    }
  }, [
    settingsLoaded,
    preferencesLoaded,
    onboardingNeeded,
    needsPreferences,
    openOnboarding,
    closeOnboarding,
  ])

  return <I18nProvider>{children}</I18nProvider>
}
