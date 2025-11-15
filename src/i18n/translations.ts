import { en } from './locales/en'
import { zhCN } from './locales/zh-CN'
import { frFR } from './locales/fr-FR'
import type { Locale, TranslationDictionary } from './types'

export type { Locale, TranslationDictionary } from './types'

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  'zh-CN': zhCN,
  'fr-FR': frFR,
}

