import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'fr-FR', label: 'Français' },
] as const

export function GeneralSettings() {
  const language = usePreferencesStore((state) => state.language) ?? 'en'
  const theme = usePreferencesStore((state) => state.theme) ?? 'light'
  const systemPrompt = usePreferencesStore((state) => state.systemPrompt) ?? ''
  const savePreferences = usePreferencesStore((state) => state.savePreferences)

  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [promptInput, setPromptInput] = useState(systemPrompt)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSelectedLanguage(language)
  }, [language])

  useEffect(() => {
    setPromptInput(systemPrompt)
  }, [systemPrompt])

  useEffect(() => {
    setHasChanges(selectedLanguage !== language || promptInput !== systemPrompt)
  }, [selectedLanguage, promptInput, language, systemPrompt])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await savePreferences({
        language: selectedLanguage,
        theme,
        systemPrompt: promptInput.trim() || undefined,
      })
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Select the interface language for Aethos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedLanguage}
            onValueChange={(value: 'en' | 'zh-CN' | 'fr-FR') => setSelectedLanguage(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System prompt</CardTitle>
          <CardDescription>
            Customize how Aethos introduces itself in every conversation. Leave empty for default
            behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            placeholder="e.g. You are Aethos, a bilingual AI workspace assistant..."
            rows={7}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

