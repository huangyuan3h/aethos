import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

import {
  DEFAULT_DARK_PRESET_ID,
  DEFAULT_LIGHT_PRESET_ID,
  getDefaultPresetForMode,
} from '@/features/preferences/theme/presets'
import {
  applyThemeToDocument,
  ensureThemePreset,
  parseThemeCustom,
  resolveThemeTokens,
  serializeCustomTokens,
} from '@/features/preferences/theme/utils'
import type { ThemeCustomTokens, ThemeMode, ThemeTokens } from '@/features/preferences/theme/types'

type LanguageOption = 'en' | 'zh-CN' | 'fr-FR'

interface SavePreferencesInput {
  language?: LanguageOption
  systemPrompt?: string
  themeMode?: ThemeMode
  themePreset?: string
  customTheme?: ThemeCustomTokens
}

interface PreferencesState {
  language?: LanguageOption
  themeMode?: ThemeMode
  themePreset?: string
  themeCustom?: ThemeCustomTokens
  themeTokens?: ThemeTokens
  systemPrompt?: string
  isLoaded: boolean
  needsSetup: boolean
  error?: string
  fetchPreferences: () => Promise<void>
  savePreferences: (input: SavePreferencesInput) => Promise<void>
  applyLanguage: (language: LanguageOption) => void
  applyTheme: (theme: ThemeMode | { mode: ThemeMode; tokens?: ThemeTokens }) => void
  markSetupComplete: () => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  language: undefined,
  themeMode: undefined,
  themePreset: undefined,
  themeCustom: undefined,
  themeTokens: undefined,
  systemPrompt: undefined,
  isLoaded: false,
  needsSetup: true,
  async fetchPreferences() {
    try {
      const response = await invoke<{
        preferences: {
          language?: string
          theme?: string
          themeMode?: string
          themePreset?: string
          themeCustom?: string
          systemPrompt?: string
        }
      }>('get_preferences')
      const language = (response.preferences.language as LanguageOption | undefined) ?? undefined
      const themeMode =
        (response.preferences.themeMode as ThemeMode | undefined) ??
        (response.preferences.theme as ThemeMode | undefined) ??
        'light'
      const presetId =
        response.preferences.themePreset ??
        (themeMode === 'dark' ? DEFAULT_DARK_PRESET_ID : DEFAULT_LIGHT_PRESET_ID)
      const customTheme = parseThemeCustom(response.preferences.themeCustom)
      const preset = ensureThemePreset(themeMode, presetId)
      const tokens = resolveThemeTokens(preset, customTheme)
      const systemPrompt = response.preferences.systemPrompt ?? undefined

      set({
        language,
        themeMode,
        themePreset: preset.id,
        themeCustom: customTheme,
        themeTokens: tokens,
        systemPrompt,
        isLoaded: true,
        needsSetup: !language || !themeMode,
      })
      if (language) {
        get().applyLanguage(language)
      }
      get().applyTheme({ mode: themeMode, tokens })
    } catch (error) {
      set({ error: (error as Error).message, isLoaded: true, needsSetup: true })
    }
  },
  async savePreferences(input) {
    const state = get()
    const updatePayload: Record<string, unknown> = {}
    if (input.language !== undefined) {
      updatePayload.language = input.language
    }
    if (input.systemPrompt !== undefined) {
      updatePayload.systemPrompt = input.systemPrompt
    }
    if (input.themeMode !== undefined) {
      updatePayload.theme = input.themeMode
      updatePayload.themeMode = input.themeMode
    }
    if (input.themePreset !== undefined) {
      updatePayload.themePreset = input.themePreset
    }
    if (input.customTheme !== undefined) {
      updatePayload.themeCustom = serializeCustomTokens(
        Object.keys(input.customTheme).length ? input.customTheme : {},
      )
    }

    if (Object.keys(updatePayload).length === 0) {
      return
    }

    await invoke('save_preferences', {
      update: updatePayload,
    })

    const nextLanguage = input.language ?? state.language
    const nextThemeMode = input.themeMode ?? state.themeMode
    const nextSystemPrompt = input.systemPrompt ?? state.systemPrompt

    set({
      language: nextLanguage,
      systemPrompt: nextSystemPrompt,
      needsSetup: !nextLanguage || !nextThemeMode,
    })

    if (input.language !== undefined && nextLanguage) {
      get().applyLanguage(nextLanguage)
    }

    if (
      input.themeMode !== undefined ||
      input.themePreset !== undefined ||
      input.customTheme !== undefined
    ) {
      const mode = nextThemeMode ?? 'light'
      const presetId =
        input.themePreset ??
        state.themePreset ??
        (mode === 'dark' ? DEFAULT_DARK_PRESET_ID : DEFAULT_LIGHT_PRESET_ID)
      const preset = ensureThemePreset(mode, presetId)
      const customTheme = input.customTheme ?? state.themeCustom ?? undefined
      const tokens = resolveThemeTokens(preset, customTheme)
      set({
        themeMode: mode,
        themePreset: preset.id,
        themeCustom: customTheme,
        themeTokens: tokens,
      })
      get().applyTheme({ mode, tokens })
    }
  },
  applyLanguage(language) {
    document.documentElement.lang = language
  },
  applyTheme(theme) {
    if (typeof theme === 'string') {
      const preset = getDefaultPresetForMode(theme)
      applyThemeToDocument({ mode: theme, tokens: preset.tokens })
      return
    }
    const tokens =
      theme.tokens ?? resolveThemeTokens(getDefaultPresetForMode(theme.mode), undefined)
    applyThemeToDocument({ mode: theme.mode, tokens })
  },
  markSetupComplete() {
    set({ needsSetup: false })
  },
}))
