import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useOnboardingStore } from '@/features/onboarding/state/onboarding.store'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'
import { useSettingsStore } from '@/features/settings/state/settings.store'

export function AppProviders({ children }: PropsWithChildren) {
  const fetchProviders = useSettingsStore((state) => state.fetchProviders)
  const fetchPreferences = usePreferencesStore((state) => state.fetchPreferences)
  const settingsLoaded = useSettingsStore((state) => state.isLoaded)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const preferencesLoaded = usePreferencesStore((state) => state.isLoaded)
  const needsPreferences = usePreferencesStore((state) => state.needsPreferences())
  const openOnboarding = useOnboardingStore((state) => state.open)
  const closeOnboarding = useOnboardingStore((state) => state.close)

  useEffect(() => {
    void Promise.all([fetchProviders(), fetchPreferences()])
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

  return children
}

