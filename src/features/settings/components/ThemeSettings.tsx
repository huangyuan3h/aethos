import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'
import { THEME_PRESETS } from '@/features/preferences/theme/presets'
import { THEME_VARIABLES } from '@/features/preferences/theme/variables'
import type { ThemeCustomTokens, ThemeTokenName } from '@/features/preferences/theme/types'
import { hslToHex, hexToHsl, resolveThemeTokens } from '@/features/preferences/theme/utils'
import { useI18n } from '@/i18n/I18nProvider'

const VARIABLE_GROUPS: Array<{ id: 'surfaces' | 'content' | 'accents' | 'feedback'; label: string }> = [
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'content', label: 'Content' },
  { id: 'accents', label: 'Accents' },
  { id: 'feedback', label: 'Feedback' },
]

function shallowCompare(
  a: ThemeCustomTokens | undefined,
  b: ThemeCustomTokens | undefined,
): boolean {
  const aKeys = Object.keys(a ?? {})
  const bKeys = Object.keys(b ?? {})
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every((key) => (a ?? {})[key as ThemeTokenName] === (b ?? {})[key as ThemeTokenName])
}

export function ThemeSettings() {
  const themeMode = usePreferencesStore((state) => state.themeMode) ?? 'light'
  const themePreset = usePreferencesStore((state) => state.themePreset)
  const themeCustom = usePreferencesStore((state) => state.themeCustom)
  const savePreferences = usePreferencesStore((state) => state.savePreferences)
  const applyTheme = usePreferencesStore((state) => state.applyTheme)
  const { t } = useI18n()

  const [selectedPreset, setSelectedPreset] = useState(themePreset ?? THEME_PRESETS[0].id)
  const [mode, setMode] = useState(themeMode)
  const [customTokens, setCustomTokens] = useState<ThemeCustomTokens>(themeCustom ?? {})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSelectedPreset(themePreset ?? THEME_PRESETS[0].id)
  }, [themePreset])

  useEffect(() => {
    setMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    setCustomTokens(themeCustom ?? {})
  }, [themeCustom])

  const preset = useMemo(() => {
    const found = THEME_PRESETS.find((item) => item.id === selectedPreset)
    return found ?? THEME_PRESETS.find((item) => item.mode === mode) ?? THEME_PRESETS[0]
  }, [mode, selectedPreset])

  const previewTokens = useMemo(
    () => resolveThemeTokens(preset, customTokens),
    [preset, customTokens],
  )

  const currentCustom = themeCustom ?? {}
  const hasChanges =
    mode !== themeMode ||
    selectedPreset !== (themePreset ?? preset.id) ||
    !shallowCompare(customTokens, currentCustom)

  const handlePresetClick = (presetId: string) => {
    const nextPreset = THEME_PRESETS.find((item) => item.id === presetId)
    if (!nextPreset) {
      return
    }
    setSelectedPreset(nextPreset.id)
    setMode(nextPreset.mode)
    setCustomTokens({})
    applyTheme({ mode: nextPreset.mode, tokens: nextPreset.tokens })
  }

  const updateCustomToken = (token: ThemeTokenName, hslValue: string) => {
    setCustomTokens((prev) => {
      const next = { ...prev }
      if (hslValue === preset.tokens[token]) {
        delete next[token]
      } else {
        next[token] = hslValue
      }
      applyTheme({ mode, tokens: resolveThemeTokens(preset, next) })
      return next
    })
  }

  const handleHexChange = (token: ThemeTokenName, hexValue: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hexValue)) {
      return
    }
    updateCustomToken(token, hexToHsl(hexValue))
  }

  const handleReset = () => {
    setCustomTokens({})
    applyTheme({ mode, tokens: preset.tokens })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await savePreferences({
        themeMode: mode,
        themePreset: preset.id,
        customTheme: customTokens,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.theme.presets.title')}</CardTitle>
            <CardDescription>{t('settings.theme.presets.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {THEME_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handlePresetClick(option.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition',
                  option.id === selectedPreset
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                    {option.mode === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <span
                    className="h-10 w-10 rounded-xl border"
                    style={{ backgroundColor: `hsl(${option.tokens.card})` }}
                  />
                  <span
                    className="h-10 w-10 rounded-xl border"
                    style={{ backgroundColor: `hsl(${option.tokens.primary})` }}
                  />
                  <span
                    className="h-10 w-10 rounded-xl border"
                    style={{ backgroundColor: `hsl(${option.tokens.accent})` }}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{t('settings.theme.custom.title')}</CardTitle>
              <CardDescription>{t('settings.theme.custom.description')}</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={Object.keys(customTokens).length === 0}
            >
              {t('settings.theme.custom.reset')}
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[28rem] pr-4">
              <div className="space-y-6">
                {VARIABLE_GROUPS.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="grid gap-3">
                      {THEME_VARIABLES.filter((variable) => variable.group === group.id).map(
                        (variable) => {
                          const tokenKey = variable.id
                          const hexValue = hslToHex(previewTokens[tokenKey])
                          return (
                            <div
                              key={variable.id}
                              className="rounded-2xl border border-border/80 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{variable.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {variable.description}
                                  </p>
                                </div>
                                <input
                                  type="color"
                                  value={hexValue}
                                  className="h-10 w-10 cursor-pointer rounded-full border border-border bg-transparent p-0"
                                  onChange={(event) => handleHexChange(tokenKey, event.target.value)}
                                />
                              </div>
                              <div className="mt-3 space-y-1">
                                <Label htmlFor={`color-${variable.id}`}>Hex</Label>
                                <Input
                                  id={`color-${variable.id}`}
                                  value={hexValue}
                                  onChange={(event) =>
                                    handleHexChange(tokenKey, event.target.value)
                                  }
                                />
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? t('common.actions.saving') : t('settings.theme.saveButton')}
        </Button>
      </div>
    </div>
  )
}

