import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useSettingsStore } from '@/features/settings/state/settings.store'

export function AppProviders({ children }: PropsWithChildren) {
  const fetchProviders = useSettingsStore((state) => state.fetchProviders)

  useEffect(() => {
    void fetchProviders()
  }, [fetchProviders])

  return children
}

