import { useEffect, useReducer, useState } from 'react'

import { PROVIDER_OPTIONS } from '../constants'
import type { ProviderUpsertPayload } from '../types'
import { useSettingsStore } from '../state/settings.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOnboardingStore } from '@/features/onboarding/state/onboarding.store'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'

interface ProviderFormProps {
  onSuccess?: () => void
  variant?: 'default' | 'compact'
}

type ProviderId = 'openai' | 'openrouter' | 'anthropic' | 'google'
type FormState = {
  provider: ProviderId
  displayName: string
  apiKey: string
  defaultModel?: string
  makeDefault: boolean
  error?: string
}

type Action =
  | { type: 'update'; field: keyof FormState; value: string | boolean | undefined }
  | { type: 'reset'; payload: FormState }
  | { type: 'error'; message?: string }

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'update':
      return { ...state, [action.field]: action.value as never, error: undefined }
    case 'reset':
      return action.payload
    case 'error':
      return { ...state, error: action.message }
    default:
      return state
  }
}

export function ProviderForm({ onSuccess, variant = 'default' }: ProviderFormProps = {}) {
  const saveProvider = useSettingsStore((state) => state.saveProvider)
  const providers = useSettingsStore((state) => state.providers)
  const closeOnboarding = useOnboardingStore((state) => state.close)
  const markSetupComplete = usePreferencesStore((state) => state.markSetupComplete)
  const [isSaving, setIsSaving] = useState(false)

  const [state, dispatch] = useReducer(reducer, {
    provider: 'openai',
    displayName: 'OpenAI',
    apiKey: '',
    defaultModel: 'gpt-4o-mini',
    makeDefault: providers.length === 0,
  })

  useEffect(() => {
    const meta = PROVIDER_OPTIONS.find((option) => option.id === state.provider)
    if (meta) {
      dispatch({ type: 'update', field: 'displayName', value: meta.label })
      dispatch({ type: 'update', field: 'defaultModel', value: meta.defaultModel })
    }
  }, [state.provider])

  const handleSave = async () => {
    if (isSaving) {
      return
    }
    if (!state.apiKey || state.apiKey.length < 8) {
      dispatch({ type: 'error', message: 'API key looks too short.' })
      return
    }
    const providerMeta = PROVIDER_OPTIONS.find((option) => option.id === state.provider)
    const payload: ProviderUpsertPayload = {
      provider: state.provider,
      displayName:
        variant === 'compact' ? (providerMeta?.label ?? state.displayName) : state.displayName,
      apiKey: state.apiKey,
      defaultModel: variant === 'compact' ? undefined : state.defaultModel,
      makeDefault: state.makeDefault,
    }
    setIsSaving(true)
    try {
      await saveProvider(payload)
      dispatch({
        type: 'reset',
        payload: {
          ...state,
          apiKey: '',
          makeDefault: false,
          error: undefined,
        },
      })
      markSetupComplete()
      closeOnboarding()
      onSuccess?.()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Provider</label>
        <Select
          value={state.provider}
          onValueChange={(value) =>
            dispatch({ type: 'update', field: 'provider', value: value as ProviderId })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id} className="flex-col items-start gap-0">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {variant === 'default' ? (
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Display name</label>
          <Input
            placeholder="OpenAI"
            value={state.displayName}
            onChange={(event) =>
              dispatch({ type: 'update', field: 'displayName', value: event.target.value })
            }
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">API Key</label>
        <Textarea
          placeholder="sk-..."
          value={state.apiKey}
          onChange={(event) =>
            dispatch({ type: 'update', field: 'apiKey', value: event.target.value })
          }
        />
        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </div>

      {variant === 'default' ? (
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Preferred model</label>
          <Input
            placeholder="gpt-4o-mini"
            value={state.defaultModel ?? ''}
            onChange={(event) =>
              dispatch({ type: 'update', field: 'defaultModel', value: event.target.value })
            }
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          checked={state.makeDefault}
          onChange={(event) =>
            dispatch({ type: 'update', field: 'makeDefault', value: event.target.checked })
          }
        />
        Make this the default provider
      </label>

      <Button className="w-full" disabled={isSaving} type="button" onClick={handleSave}>
        {isSaving ? 'Saving...' : 'Save provider'}
      </Button>
    </div>
  )
}
