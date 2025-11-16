import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'
import { THEME_VARIABLES } from '@/features/preferences/theme/variables'
import type { ThemeProfile, ThemeTokenName } from '@/features/preferences/theme/types'
import { hexToHsl, hslToHex } from '@/features/preferences/theme/utils'
import { useI18n } from '@/i18n/I18nProvider'

const VARIABLE_GROUPS: Array<{ id: 'surfaces' | 'content' | 'accents' | 'feedback'; label: string }> = [
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'content', label: 'Content' },
  { id: 'accents', label: 'Accents' },
  { id: 'feedback', label: 'Feedback' },
]

export function ThemeSettings() {
  const builtinThemes = usePreferencesStore((state) => state.builtinThemes)
  const customThemes = usePreferencesStore((state) => state.customThemes)
  const activeThemeId = usePreferencesStore((state) => state.activeThemeId)
  const setActiveTheme = usePreferencesStore((state) => state.setActiveTheme)
  const createTheme = usePreferencesStore((state) => state.createTheme)
  const updateTheme = usePreferencesStore((state) => state.updateTheme)
  const deleteTheme = usePreferencesStore((state) => state.deleteTheme)
  const duplicateTheme = usePreferencesStore((state) => state.duplicateTheme)
  const { t } = useI18n()

  const allThemes = useMemo(() => [...builtinThemes, ...customThemes], [builtinThemes, customThemes])
  const initialSelection = activeThemeId ?? allThemes[0]?.id
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(initialSelection)
  const selectedTheme = allThemes.find((theme) => theme.id === selectedThemeId)
  const [draft, setDraft] = useState<ThemeProfile | undefined>(() =>
    selectedTheme
      ? {
          ...selectedTheme,
          tokens: { ...selectedTheme.tokens },
          typography: { ...selectedTheme.typography },
        }
      : undefined,
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selectedThemeId) {
      setSelectedThemeId(initialSelection)
    }
  }, [initialSelection, selectedThemeId])

  useEffect(() => {
    if (!selectedTheme) {
      setDraft(undefined)
      return
    }
    setDraft({
      ...selectedTheme,
      tokens: { ...selectedTheme.tokens },
      typography: { ...selectedTheme.typography },
    })
  }, [selectedTheme])

  const isCustom = selectedTheme ? !selectedTheme.isBuiltin : false
  const isDirty =
    !!draft &&
    selectedTheme &&
    (draft.name !== selectedTheme.name ||
      draft.mode !== selectedTheme.mode ||
      JSON.stringify(draft.tokens) !== JSON.stringify(selectedTheme.tokens) ||
      JSON.stringify(draft.typography) !== JSON.stringify(selectedTheme.typography))

  const handleTokenChange = (token: ThemeTokenName, value: string) => {
    if (!draft) {
      return
    }
    setDraft({
      ...draft,
      tokens: {
        ...draft.tokens,
        [token]: value,
      },
    })
  }

  const handleTypographyChange = (field: keyof ThemeProfile['typography'], value: number) => {
    if (!draft) {
      return
    }
    setDraft({
      ...draft,
      typography: {
        ...draft.typography,
        [field]: value,
      },
    })
  }

  const handleSave = async () => {
    if (!draft || !isCustom) {
      return
    }
    setSaving(true)
    try {
      await updateTheme(draft.id, {
        name: draft.name,
        mode: draft.mode,
        tokens: draft.tokens,
        typography: draft.typography,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTheme = async () => {
    const created = await createTheme({
      baseThemeId: selectedThemeId,
      name: t('settings.theme.library.newName', { defaultValue: 'New theme' }),
    })
    setSelectedThemeId(created.id)
  }

  const handleDuplicateTheme = async (id: string) => {
    const copy = await duplicateTheme(id)
    if (copy) {
      setSelectedThemeId(copy.id)
    }
  }

  const handleDeleteTheme = async (id: string) => {
    if (!window.confirm(t('settings.theme.library.deleteConfirm', { defaultValue: 'Delete this theme?' }))) {
      return
    }
    await deleteTheme(id)
    setSelectedThemeId(activeThemeId ?? builtinThemes[0]?.id)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('settings.theme.library.title')}</CardTitle>
            <CardDescription>{t('settings.theme.library.description')}</CardDescription>
          </div>
          <Button onClick={handleCreateTheme}>{t('settings.theme.library.new')}</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {allThemes.map((theme) => (
              <div
                key={theme.id}
                className={cn(
                  'rounded-2xl border p-4 transition',
                  selectedThemeId === theme.id ? 'border-primary' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">{theme.mode === 'dark' ? 'Dark' : 'Light'}</p>
                  </div>
                  {activeThemeId === theme.id ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary-foreground">
                      {t('settings.theme.library.active')}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="h-10 w-10 rounded-xl border" style={{ backgroundColor: `hsl(${theme.tokens.card})` }} />
                  <span className="h-10 w-10 rounded-xl border" style={{ backgroundColor: `hsl(${theme.tokens.primary})` }} />
                  <span className="h-10 w-10 rounded-xl border" style={{ backgroundColor: `hsl(${theme.tokens.accent})` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedThemeId(theme.id)}>
                    {t('settings.theme.library.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveTheme(theme.id)}
                    disabled={activeThemeId === theme.id}
                  >
                    {activeThemeId === theme.id
                      ? t('settings.theme.library.active')
                      : t('settings.theme.library.setActive')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicateTheme(theme.id)}>
                    {t('settings.theme.library.duplicate')}
                  </Button>
                  {!theme.isBuiltin ? (
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteTheme(theme.id)}>
                      {t('settings.theme.library.delete')}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.theme.editor.title')}</CardTitle>
          <CardDescription>{t('settings.theme.editor.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!draft ? (
            <p className="text-sm text-muted-foreground">{t('settings.theme.editor.placeholder')}</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t('settings.theme.editor.name')}</Label>
                  <Input
                    value={draft.name}
                    disabled={!isCustom}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('settings.theme.editor.mode')}</Label>
                  <Select
                    value={draft.mode}
                    disabled={!isCustom}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        mode: value as ThemeProfile['mode'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t('settings.theme.editor.fontSize')}</Label>
                  <Input
                    type="number"
                    min={12}
                    max={22}
                    value={draft.typography.baseSize}
                    disabled={!isCustom}
                    onChange={(event) => handleTypographyChange('baseSize', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label>{t('settings.theme.editor.headingScale')}</Label>
                  <Input
                    type="number"
                    step={0.05}
                    min={1.1}
                    max={1.6}
                    value={draft.typography.headingScale}
                    disabled={!isCustom}
                    onChange={(event) => handleTypographyChange('headingScale', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label>{t('settings.theme.editor.lineHeight')}</Label>
                  <Input
                    type="number"
                    step={0.05}
                    min={1.3}
                    max={1.9}
                    value={draft.typography.lineHeight}
                    disabled={!isCustom}
                    onChange={(event) => handleTypographyChange('lineHeight', Number(event.target.value))}
                  />
                </div>
              </div>

              {!isCustom ? (
                <p className="text-xs text-muted-foreground">{t('settings.theme.editor.readonly')}</p>
              ) : null}

              <ScrollArea className="max-h-[28rem] pr-4">
                <div className="space-y-6">
                  {VARIABLE_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {THEME_VARIABLES.filter((variable) => variable.group === group.id).map((variable) => {
                          const tokenKey = variable.id
                          const hexValue = hslToHex(draft.tokens[tokenKey])
                          return (
                            <div key={variable.id} className="rounded-2xl border border-border/80 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{variable.label}</p>
                                  <p className="text-xs text-muted-foreground">{variable.description}</p>
                                </div>
                                <input
                                  type="color"
                                  value={hexValue}
                                  disabled={!isCustom}
                                  className="h-10 w-10 cursor-pointer rounded-full border border-border bg-transparent p-0"
                                  onChange={(event) => handleTokenChange(tokenKey, hexToHsl(event.target.value))}
                                />
                              </div>
                              <div className="mt-3 space-y-1">
                                <Label htmlFor={`color-${variable.id}`}>Hex</Label>
                                <Input
                                  id={`color-${variable.id}`}
                                  disabled={!isCustom}
                                  value={hexValue}
                                  onChange={(event) => handleTokenChange(tokenKey, hexToHsl(event.target.value))}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={!isCustom || !selectedTheme}
                  onClick={() => {
                    if (selectedTheme) {
                      setDraft({
                        ...selectedTheme,
                        tokens: { ...selectedTheme.tokens },
                        typography: { ...selectedTheme.typography },
                      })
                    }
                  }}
                >
                  {t('settings.theme.editor.reset')}
                </Button>
                <Button onClick={handleSave} disabled={!isCustom || !isDirty || saving}>
                  {saving ? t('common.actions.saving') : t('settings.theme.editor.save')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

