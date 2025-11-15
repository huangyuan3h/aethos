import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

import type { ProviderSummary, ProviderUpsertPayload } from '../types'

interface SettingsState {
  providers: ProviderSummary[]
  isSettingsOpen: boolean
  isLoading: boolean
  onboardingNeeded: boolean
  isLoaded: boolean
  error?: string
  fetchProviders: () => Promise<void>
  saveProvider: (payload: ProviderUpsertPayload) => Promise<void>
  setDefaultProvider: (provider: string) => Promise<void>
  openSettings: () => void
  closeSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  isSettingsOpen: false,
  isLoading: false,
  onboardingNeeded: false,
  isLoaded: false,
  async fetchProviders() {
    set({ isLoading: true, error: undefined })
    try {
      const response = await invoke<{ items: ProviderSummary[] }>('list_providers')
      const items = response.items
      const onboardingNeeded = items.length === 0 || items.every((p) => !p.hasApiKey)
      set({
        providers: items,
        isLoading: false,
        onboardingNeeded,
        isSettingsOpen: onboardingNeeded || get().isSettingsOpen,
        isLoaded: true,
      })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, isLoaded: true })
    }
  },
  async saveProvider(payload) {
    set({ error: undefined, onboardingNeeded: false, isSettingsOpen: false })
    await invoke('upsert_provider', { payload })
    await get().fetchProviders()
  },
  async setDefaultProvider(provider) {
    await invoke('set_default_provider', { provider })
    await get().fetchProviders()
  },
  openSettings() {
    set({ isSettingsOpen: true })
  },
  closeSettings() {
    if (get().onboardingNeeded) {
      return
    }
    set({ isSettingsOpen: false })
  },
}))

