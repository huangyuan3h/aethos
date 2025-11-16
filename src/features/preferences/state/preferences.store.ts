import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { nanoid } from 'nanoid'

import {
  BUILTIN_THEMES,
  createThemeFromBase,
  getDefaultThemeForMode,
} from '@/features/preferences/theme/presets'
import {
  applyThemeProfile,
  getAllThemes,
  mergeTokens,
  parseThemeCustom,
  parseThemeLibrary,
  serializeThemeLibrary,
} from '@/features/preferences/theme/utils'
import type {
  ThemeMode,
  ThemeProfile,
  ThemeTokens,
  ThemeTypography,
} from '@/features/preferences/theme/types'

type LanguageOption = 'en' | 'zh-CN' | 'fr-FR'

interface SavePreferencesInput {
  language?: LanguageOption
  systemPrompt?: string
}

interface PreferencesState {
  language?: LanguageOption
  systemPrompt?: string
  isLoaded: boolean
  needsSetup: boolean
  error?: string
  themeMode?: ThemeMode
  activeThemeId?: string
  builtinThemes: ThemeProfile[]
  customThemes: ThemeProfile[]
  fetchPreferences: () => Promise<void>
  savePreferences: (input: SavePreferencesInput) => Promise<void>
  applyLanguage: (language: LanguageOption) => void
  setActiveTheme: (id: string) => Promise<void>
  createTheme: (payload: ThemeCreationPayload) => Promise<ThemeProfile>
  updateTheme: (id: string, payload: ThemeUpdatePayload) => Promise<void>
  deleteTheme: (id: string) => Promise<void>
  duplicateTheme: (id: string, name?: string) => Promise<ThemeProfile | undefined>
  markSetupComplete: () => void
}

interface ThemeCreationPayload {
  baseThemeId?: string
  name?: string
  mode?: ThemeMode
}

interface ThemeUpdatePayload {
  name?: string
  mode?: ThemeMode
  tokens?: ThemeTokens
  typography?: ThemeTypography
}

async function persistThemePreferences(update: Record<string, unknown>) {
  await invoke('save_preferences', { update })
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  language: undefined,
  themeMode: undefined,
  systemPrompt: undefined,
  isLoaded: false,
  needsSetup: true,
  activeThemeId: undefined,
  builtinThemes: BUILTIN_THEMES,
  customThemes: [],
  async fetchPreferences() {
    try {
      const response = await invoke<{
        preferences: {
          language?: string
          theme?: string
          themeMode?: string
          themeCustom?: string
          themeActiveId?: string
          themeLibrary?: string
          systemPrompt?: string
        }
      }>('get_preferences')
      const language = (response.preferences.language as LanguageOption | undefined) ?? undefined
      const systemPrompt = response.preferences.systemPrompt ?? undefined
      const themeMode =
        (response.preferences.themeMode as ThemeMode | undefined) ??
        (response.preferences.theme as ThemeMode | undefined) ??
        'light'

      let customThemes = parseThemeLibrary(response.preferences.themeLibrary)
      if (!customThemes.length) {
        const overrides = parseThemeCustom(response.preferences.themeCustom)
        if (overrides) {
          const base = getDefaultThemeForMode(themeMode)
          customThemes = [
            createThemeFromBase(base, {
              id: nanoid(),
              name: `${base.name} custom`,
              tokens: mergeTokens(base.tokens, overrides),
              isBuiltin: false,
            }),
          ]
        }
      }

      const requestedThemeId =
        response.preferences.themeActiveId ??
        response.preferences.themePreset ??
        (themeMode === 'dark'
          ? BUILTIN_THEMES.find((theme) => theme.mode === 'dark')?.id
          : BUILTIN_THEMES.find((theme) => theme.mode === 'light')?.id) ??
        BUILTIN_THEMES[0].id

      const availableThemes = getAllThemes(customThemes)
      let activeTheme = availableThemes.find((theme) => theme.id === requestedThemeId)
      if (!activeTheme) {
        activeTheme = getDefaultThemeForMode(themeMode)
      }

      set({
        language,
        systemPrompt,
        themeMode: activeTheme.mode,
        activeThemeId: activeTheme.id,
        customThemes,
        isLoaded: true,
        needsSetup: !language,
      })
      if (language) {
        get().applyLanguage(language)
      }
      applyThemeProfile(activeTheme)
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
    if (Object.keys(updatePayload).length === 0) {
      return
    }
    await persistThemePreferences(updatePayload)
    const nextLanguage = input.language ?? state.language
    set({
      language: nextLanguage,
      systemPrompt: input.systemPrompt ?? state.systemPrompt,
      needsSetup: !nextLanguage,
    })
    if (input.language) {
      get().applyLanguage(input.language)
    }
  },
  applyLanguage(language) {
    document.documentElement.lang = language
  },
  async setActiveTheme(id) {
    const state = get()
    const theme = getAllThemes(state.customThemes).find((item) => item.id === id)
    if (!theme) {
      return
    }
    set({ activeThemeId: id, themeMode: theme.mode })
    applyThemeProfile(theme)
    await persistThemePreferences({
      themeActiveId: id,
      themeMode: theme.mode,
    })
  },
  async createTheme({ baseThemeId, name, mode }) {
    const state = get()
    const base =
      getAllThemes(state.customThemes).find((theme) => theme.id === baseThemeId) ??
      getDefaultThemeForMode(mode ?? state.themeMode ?? 'light')
    const newTheme = createThemeFromBase(base, {
      id: nanoid(),
      name: name ?? `${base.name} ${state.customThemes.length + 1}`,
      mode: mode ?? base.mode,
      isBuiltin: false,
    })
    const customThemes = [...state.customThemes, newTheme]
    set({ customThemes })
    await persistThemePreferences({
      themeLibrary: serializeThemeLibrary(customThemes),
    })
    return newTheme
  },
  async updateTheme(id, payload) {
    const state = get()
    const customThemes = state.customThemes.map((theme) =>
      theme.id === id
        ? {
            ...theme,
            ...payload,
            tokens: payload.tokens ?? theme.tokens,
            typography: payload.typography ?? theme.typography,
            mode: payload.mode ?? theme.mode,
          }
        : theme,
    )
    set({ customThemes })
    await persistThemePreferences({
      themeLibrary: serializeThemeLibrary(customThemes),
    })
    if (state.activeThemeId === id) {
      const updated = customThemes.find((theme) => theme.id === id)
      if (updated) {
        set({ themeMode: updated.mode })
        applyThemeProfile(updated)
        await persistThemePreferences({
          themeActiveId: updated.id,
          themeMode: updated.mode,
        })
      }
    }
  },
  async deleteTheme(id) {
    const state = get()
    const customThemes = state.customThemes.filter((theme) => theme.id !== id)
    set({ customThemes })
    await persistThemePreferences({
      themeLibrary: serializeThemeLibrary(customThemes),
    })
    if (state.activeThemeId === id) {
      const fallback = getDefaultThemeForMode(state.themeMode ?? 'light')
      set({ activeThemeId: fallback.id, themeMode: fallback.mode })
      applyThemeProfile(fallback)
      await persistThemePreferences({
        themeActiveId: fallback.id,
        themeMode: fallback.mode,
      })
    }
  },
  async duplicateTheme(id, name) {
    const state = get()
    const source = getAllThemes(state.customThemes).find((theme) => theme.id === id)
    if (!source) {
      return undefined
    }
    const copy = createThemeFromBase(source, {
      id: nanoid(),
      name: name ?? `${source.name} copy`,
      isBuiltin: false,
    })
    const customThemes = [...state.customThemes, copy]
    set({ customThemes })
    await persistThemePreferences({
      themeLibrary: serializeThemeLibrary(customThemes),
    })
    return copy
  },
  markSetupComplete() {
    set({ needsSetup: false })
  },
}))
