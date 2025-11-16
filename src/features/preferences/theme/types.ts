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

export type ThemeTokens = Record<ThemeTokenName, string>

export type ThemeCustomTokens = Partial<ThemeTokens>

export interface ThemePreset {
  id: string
  label: string
  description: string
  mode: ThemeMode
  tokens: ThemeTokens
}

export interface ResolvedTheme {
  mode: ThemeMode
  tokens: ThemeTokens
}

export interface ThemeVariableDefinition {
  id: ThemeTokenName
  label: string
  description: string
  group: 'surfaces' | 'content' | 'accents' | 'feedback'
}

