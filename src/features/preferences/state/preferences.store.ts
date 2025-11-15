import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

import { applyThemeClass } from '../utils/theme'

type ThemeOption = 'light' | 'dark'
type LanguageOption = 'en' | 'zh-CN'

interface PreferencesState {
  language?: LanguageOption
  theme?: ThemeOption
  isLoaded: boolean
  error?: string
  fetchPreferences: () => Promise<void>
  savePreferences: (input: { language: LanguageOption; theme: ThemeOption }) => Promise<void>
  applyLanguage: (language: LanguageOption) => void
  applyTheme: (theme: ThemeOption) => void
  needsPreferences: () => boolean
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  language: undefined,
  theme: undefined,
  isLoaded: false,
  async fetchPreferences() {
    try {
      const response = await invoke<{ preferences: { language?: string; theme?: string } }>(
        'get_preferences',
      )
      const language = (response.preferences.language as LanguageOption | undefined) ?? undefined
      const theme = (response.preferences.theme as ThemeOption | undefined) ?? undefined
      set({ language, theme, isLoaded: true })
      if (language) {
        get().applyLanguage(language)
      }
      if (theme) {
        get().applyTheme(theme)
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoaded: true })
    }
  },
  async savePreferences({ language, theme }) {
    await invoke('save_preferences', {
      update: { language, theme },
    })
    set({ language, theme })
    get().applyLanguage(language)
    get().applyTheme(theme)
  },
  applyLanguage(language) {
    // placeholder for future i18n wiring
    document.documentElement.lang = language
  },
  applyTheme(theme) {
    applyThemeClass(theme)
  },
  needsPreferences() {
    const state = get()
    return !state.language || !state.theme
  },
}))

