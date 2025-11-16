import type { ThemeMode, ThemePreset, ThemeTokens } from './types'

const auroraLight: ThemeTokens = {
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
}

const nocturneDark: ThemeTokens = {
  background: '222 84% 5%',
  foreground: '210 40% 98%',
  muted: '217 25% 14%',
  'muted-foreground': '215 20% 72%',
  popover: '222 84% 4%',
  'popover-foreground': '210 40% 98%',
  card: '222 84% 6%',
  'card-foreground': '210 40% 98%',
  border: '217 34% 20%',
  input: '217 34% 20%',
  primary: '214 96% 62%',
  'primary-foreground': '222 47% 12%',
  secondary: '222 23% 18%',
  'secondary-foreground': '210 40% 96%',
  accent: '180 72% 66%',
  'accent-foreground': '222 47% 12%',
  destructive: '0 63% 48%',
  'destructive-foreground': '210 40% 98%',
  ring: '214 96% 62%',
}

const dawnWarm: ThemeTokens = {
  background: '24 60% 97%',
  foreground: '18 35% 20%',
  muted: '25 45% 92%',
  'muted-foreground': '20 22% 45%',
  popover: '24 65% 98%',
  'popover-foreground': '18 35% 22%',
  card: '24 60% 99%',
  'card-foreground': '18 35% 20%',
  border: '20 35% 90%',
  input: '20 35% 90%',
  primary: '12 74% 55%',
  'primary-foreground': '0 0% 100%',
  secondary: '38 80% 80%',
  'secondary-foreground': '20 30% 20%',
  accent: '345 75% 60%',
  'accent-foreground': '0 0% 100%',
  destructive: '2 84% 58%',
  'destructive-foreground': '0 0% 100%',
  ring: '12 74% 55%',
}

const midnightNeon: ThemeTokens = {
  background: '240 27% 6%',
  foreground: '220 25% 96%',
  muted: '240 15% 14%',
  'muted-foreground': '220 20% 75%',
  popover: '240 27% 8%',
  'popover-foreground': '220 25% 96%',
  card: '240 27% 9%',
  'card-foreground': '220 25% 96%',
  border: '240 20% 18%',
  input: '240 20% 18%',
  primary: '282 83% 67%',
  'primary-foreground': '264 45% 12%',
  secondary: '200 80% 45%',
  'secondary-foreground': '210 25% 12%',
  accent: '145 70% 52%',
  'accent-foreground': '180 30% 10%',
  destructive: '0 70% 50%',
  'destructive-foreground': '0 0% 100%',
  ring: '282 83% 67%',
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'aurora-light',
    label: 'Aurora Light',
    description: 'Bright neutral surfaces with cool blue accents.',
    mode: 'light',
    tokens: auroraLight,
  },
  {
    id: 'nocturne-dark',
    label: 'Nocturne Dark',
    description: 'High-contrast layout tuned for dim environments.',
    mode: 'dark',
    tokens: nocturneDark,
  },
  {
    id: 'dawn-warm',
    label: 'Dawn Warm',
    description: 'Soft warm palette inspired by sunrise tones.',
    mode: 'light',
    tokens: dawnWarm,
  },
  {
    id: 'midnight-neon',
    label: 'Midnight Neon',
    description: 'Moody dark surfaces with neon highlights.',
    mode: 'dark',
    tokens: midnightNeon,
  },
]

export const DEFAULT_LIGHT_PRESET_ID = 'aurora-light'
export const DEFAULT_DARK_PRESET_ID = 'nocturne-dark'

export function getThemePresetById(id?: string | null): ThemePreset | undefined {
  if (!id) {
    return undefined
  }
  return THEME_PRESETS.find((preset) => preset.id === id)
}

export function getDefaultPresetForMode(mode: ThemeMode): ThemePreset {
  if (mode === 'dark') {
    return (
      getThemePresetById(DEFAULT_DARK_PRESET_ID) ??
      THEME_PRESETS.find((preset) => preset.mode === 'dark') ??
      THEME_PRESETS[0]
    )
  }
  return (
    getThemePresetById(DEFAULT_LIGHT_PRESET_ID) ??
    THEME_PRESETS.find((preset) => preset.mode === 'light') ??
    THEME_PRESETS[0]
  )
}

