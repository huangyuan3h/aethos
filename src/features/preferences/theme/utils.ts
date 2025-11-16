import { BUILTIN_THEMES, DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, getDefaultThemeForMode } from './presets'
import type {
  ThemeCustomTokens,
  ThemeMode,
  ThemeProfile,
  ThemeTokens,
  ThemeTokenName,
  ThemeTypography,
} from './types'

const TYPOGRAPHY_LIMITS = {
  baseSize: { min: 12, max: 22 },
  headingScale: { min: 1.1, max: 1.6 },
  lineHeight: { min: 1.3, max: 1.9 },
}

export function mergeTokens(base: ThemeTokens, overrides?: ThemeCustomTokens): ThemeTokens {
  const tokens: ThemeTokens = { ...base }
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value && key in tokens) {
        tokens[key as ThemeTokenName] = value
      }
    }
  }
  return tokens
}

export function applyThemeProfile(profile: ThemeProfile) {
  const root = document.documentElement
  if (profile.mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  Object.entries(profile.tokens).forEach(([token, value]) => {
    root.style.setProperty(`--${token}`, value)
  })
  root.style.setProperty('--font-base-size', `${profile.typography.baseSize}px`)
  root.style.setProperty('--font-heading-scale', profile.typography.headingScale.toString())
  root.style.setProperty('--line-height-base', profile.typography.lineHeight.toString())
  root.style.fontSize = `${profile.typography.baseSize}px`
}

export function parseThemeCustom(raw?: string | null): ThemeCustomTokens | undefined {
  if (!raw) {
    return undefined
  }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as ThemeCustomTokens
    }
  } catch {
    return undefined
  }
  return undefined
}

export function serializeCustomTokens(overrides: ThemeCustomTokens | undefined): string | undefined {
  if (!overrides) {
    return undefined
  }
  return JSON.stringify(overrides)
}

export function parseThemeLibrary(raw?: string | null): ThemeProfile[] {
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => normalizeStoredProfile(entry))
        .filter((entry): entry is ThemeProfile => Boolean(entry))
    }
  } catch {
    return []
  }
  return []
}

function normalizeStoredProfile(entry: unknown): ThemeProfile | undefined {
  if (!entry || typeof entry !== 'object') {
    return undefined
  }
  const candidate = entry as Record<string, unknown>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    (candidate.mode !== 'light' && candidate.mode !== 'dark')
  ) {
    return undefined
  }

  const fallback = getDefaultThemeForMode(candidate.mode)
  const storedTokens = candidate.tokens as Record<string, string> | undefined
  const tokens: ThemeTokens = { ...fallback.tokens }
  if (storedTokens) {
    for (const [key, value] of Object.entries(storedTokens)) {
      if (typeof value === 'string' && key in tokens) {
        tokens[key as ThemeTokenName] = value
      }
    }
  }

  const storedTypography = candidate.typography as Partial<ThemeTypography> | undefined
  const typography: ThemeTypography = {
    baseSize: clamp(
      storedTypography?.baseSize ?? fallback.typography.baseSize,
      TYPOGRAPHY_LIMITS.baseSize.min,
      TYPOGRAPHY_LIMITS.baseSize.max,
    ),
    headingScale: clamp(
      storedTypography?.headingScale ?? fallback.typography.headingScale,
      TYPOGRAPHY_LIMITS.headingScale.min,
      TYPOGRAPHY_LIMITS.headingScale.max,
    ),
    lineHeight: clamp(
      storedTypography?.lineHeight ?? fallback.typography.lineHeight,
      TYPOGRAPHY_LIMITS.lineHeight.min,
      TYPOGRAPHY_LIMITS.lineHeight.max,
    ),
  }

  return {
    id: candidate.id,
    name: candidate.name,
    mode: candidate.mode,
    tokens,
    typography,
  }
}

export function serializeThemeLibrary(profiles: ThemeProfile[]): string {
  return JSON.stringify(
    profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      mode: profile.mode,
      tokens: profile.tokens,
      typography: profile.typography,
    })),
  )
}

export function getDefaultThemeIdForMode(mode: ThemeMode): string {
  return mode === 'dark' ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID
}

export function getAllThemes(customThemes: ThemeProfile[]): ThemeProfile[] {
  return [...BUILTIN_THEMES, ...customThemes]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function hslToHex(value: string | undefined): string {
  if (!value) {
    return '#000000'
  }
  const [hStr = '0', sStr = '0%', lStr = '0%'] = value.split(' ')
  const h = Number.parseFloat(hStr)
  const s = Number.parseFloat(sStr.replace('%', '')) / 100
  const l = Number.parseFloat(lStr.replace('%', '')) / 100

  if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) {
    return '#000000'
  }

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (channel: number) => {
    const normalized = Math.round((channel + m) * 255)
    return normalized.toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToHsl(hex: string): string {
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) {
    return '0 0% 0%'
  }

  const r = Number.parseInt(sanitized.slice(0, 2), 16) / 255
  const g = Number.parseInt(sanitized.slice(2, 4), 16) / 255
  const b = Number.parseInt(sanitized.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }

  const l = (max + min) / 2

  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
  }

  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

