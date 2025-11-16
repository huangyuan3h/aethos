import { nanoid } from 'nanoid'

import type { ThemeMode, ThemeProfile, ThemeTokens, ThemeTypography } from './types'

const auroraLightTokens: ThemeTokens = {
  background: '0 0% 100%',
  foreground: '222 47% 11%',
  muted: '214 44% 96%',
  'muted-foreground': '214 16% 46%',
  popover: '0 0% 100%',
  'popover-foreground': '222 47% 11%',
  card: '0 0% 100%',
  'card-foreground': '222 47% 11%',
  border: '214 32% 91%',
  input: '214 32% 91%',
  primary: '221 83% 53%',
  'primary-foreground': '210 40% 98%',
  secondary: '210 40% 96%',
  'secondary-foreground': '222 45% 12%',
  accent: '199 89% 48%',
  'accent-foreground': '210 40% 98%',
  destructive: '0 84% 60%',
  'destructive-foreground': '0 0% 100%',
  ring: '221 83% 53%',
  active: '255 90% 65%',
  'active-foreground': '0 0% 100%',
  link: '220 90% 56%',
  'link-foreground': '210 40% 98%',
}

const nocturneDarkTokens: ThemeTokens = {
  background: '222 84% 5%',
  foreground: '210 40% 96%',
  muted: '217 25% 14%',
  'muted-foreground': '215 20% 72%',
  popover: '222 84% 4%',
  'popover-foreground': '210 40% 96%',
  card: '222 84% 7%',
  'card-foreground': '210 40% 96%',
  border: '217 34% 20%',
  input: '217 34% 20%',
  primary: '214 96% 62%',
  'primary-foreground': '210 40% 96%',
  secondary: '222 23% 18%',
  'secondary-foreground': '210 40% 96%',
  accent: '180 72% 66%',
  'accent-foreground': '222 47% 12%',
  destructive: '0 63% 48%',
  'destructive-foreground': '210 40% 98%',
  ring: '214 96% 62%',
  active: '266 84% 70%',
  'active-foreground': '222 84% 5%',
  link: '198 94% 67%',
  'link-foreground': '222 84% 4%',
}

const defaultTypography: ThemeTypography = {
  baseSize: 16,
  headingScale: 1.25,
  lineHeight: 1.6,
}

const headingForwardTypography: ThemeTypography = {
  baseSize: 15,
  headingScale: 1.3,
  lineHeight: 1.7,
}

export const DEFAULT_LIGHT_THEME_ID = 'aurora-light'
export const DEFAULT_DARK_THEME_ID = 'nocturne-dark'

export const BUILTIN_THEMES: ThemeProfile[] = [
  {
    id: DEFAULT_LIGHT_THEME_ID,
    name: 'Aurora Light',
    mode: 'light',
    tokens: auroraLightTokens,
    typography: defaultTypography,
    isBuiltin: true,
  },
  {
    id: DEFAULT_DARK_THEME_ID,
    name: 'Nocturne Dark',
    mode: 'dark',
    tokens: nocturneDarkTokens,
    typography: headingForwardTypography,
    isBuiltin: true,
  },
]

export function getDefaultThemeForMode(mode: ThemeMode): ThemeProfile {
  if (mode === 'dark') {
    return BUILTIN_THEMES.find((theme) => theme.mode === 'dark') ?? BUILTIN_THEMES[0]
  }
  return BUILTIN_THEMES.find((theme) => theme.mode === 'light') ?? BUILTIN_THEMES[0]
}

export function createThemeFromBase(base: ThemeProfile, overrides?: Partial<ThemeProfile>): ThemeProfile {
  return {
    ...base,
    ...overrides,
    id: overrides?.id ?? nanoid(),
    name: overrides?.name ?? `${base.name} copy`,
    tokens: { ...base.tokens, ...(overrides?.tokens ?? {}) },
    typography: { ...base.typography, ...(overrides?.typography ?? {}) },
    isBuiltin: overrides?.isBuiltin ?? false,
  }
}

