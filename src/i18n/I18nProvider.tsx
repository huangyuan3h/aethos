import { createContext, useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'

import { usePreferencesStore } from '@/features/preferences/state/preferences.store'

import { translations, type Locale } from './translations'

type TranslationVariables = Record<string, string | number | undefined>

interface I18nContextValue {
  locale: Locale
  t: (key: string, vars?: TranslationVariables) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key: string) => key,
})

function resolveTranslation(locale: Locale, key: string) {
  const parts = key.split('.')
  let cursor: unknown = translations[locale]
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in cursor) {
      cursor = (cursor as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof cursor === 'string' ? cursor : undefined
}

function translate(locale: Locale, key: string, vars?: TranslationVariables) {
  const template =
    resolveTranslation(locale, key) ??
    resolveTranslation('en', key) ??
    key
  if (!vars) {
    return template
  }
  return template.replace(/\{\{(.*?)\}\}/g, (_, token) => {
    const value = vars[token.trim()]
    return value !== undefined ? String(value) : ''
  })
}

export function I18nProvider({ children }: PropsWithChildren) {
  const language = usePreferencesStore((state) => state.language) ?? 'en'
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: language,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

