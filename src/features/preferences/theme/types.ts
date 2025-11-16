export type ThemeMode = 'light' | 'dark'

export type ThemeTokenName =
  | 'background'
  | 'foreground'
  | 'muted'
  | 'muted-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'card'
  | 'card-foreground'
  | 'border'
  | 'input'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'ring'
  | 'active'
  | 'active-foreground'
  | 'link'
  | 'link-foreground'

export type ThemeTokens = Record<ThemeTokenName, string>

export type ThemeCustomTokens = Partial<ThemeTokens>

export interface ThemePreset {
  id: string
  label: string
  description: string
  mode: ThemeMode
  tokens: ThemeTokens
}

export interface ThemeTypography {
  baseSize: number
  headingScale: number
  lineHeight: number
}

export interface ThemeProfile {
  id: string
  name: string
  mode: ThemeMode
  tokens: ThemeTokens
  typography: ThemeTypography
  isBuiltin?: boolean
}

export type ThemeProfileDTO = Omit<ThemeProfile, 'isBuiltin'>

export interface StoredThemeProfile {
  id: string
  name: string
  mode: ThemeMode
  tokens: ThemeTokens
  typography: ThemeTypography
}

export interface ResolvedTheme {
  mode: ThemeMode
  tokens: ThemeTokens
  typography: ThemeTypography
}

export interface ThemeVariableDefinition {
  id: ThemeTokenName
  label: string
  description: string
  group: 'surfaces' | 'content' | 'accents' | 'feedback'
}

