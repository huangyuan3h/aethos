import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

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

const schema = z.object({
  provider: z.enum(['openai', 'openrouter', 'anthropic', 'google']),
  displayName: z.string().min(2),
  apiKey: z.string().min(8, 'API key looks too short'),
  defaultModel: z.string().optional(),
  makeDefault: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface ProviderFormProps {
  onSuccess?: () => void
  variant?: 'default' | 'compact'
}

export function ProviderForm({ onSuccess, variant = 'default' }: ProviderFormProps = {}) {
  const saveProvider = useSettingsStore((state) => state.saveProvider)
  const isLoading = useSettingsStore((state) => state.isLoading)
  const providers = useSettingsStore((state) => state.providers)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: 'openai',
      displayName: 'OpenAI',
      apiKey: '',
      defaultModel: 'gpt-4o-mini',
      makeDefault: providers.length === 0,
    },
  })

  const [selectedProvider, setSelectedProvider] =
    useState<FormValues['provider']>(form.getValues('provider'))

  useEffect(() => {
    const meta = PROVIDER_OPTIONS.find((option) => option.id === selectedProvider)
    if (meta) {
      form.setValue('displayName', meta.label, { shouldValidate: true })
      form.setValue('defaultModel', meta.defaultModel)
    }
  }, [selectedProvider, form])

  const onSubmit = async (values: FormValues) => {
    const providerMeta = PROVIDER_OPTIONS.find((option) => option.id === values.provider)
    const payload: ProviderUpsertPayload = {
      provider: values.provider,
      displayName: variant === 'compact' ? providerMeta?.label ?? values.displayName : values.displayName,
      apiKey: values.apiKey,
      defaultModel: variant === 'compact' ? undefined : values.defaultModel,
      makeDefault: Boolean(values.makeDefault),
    }
    await saveProvider(payload)
    form.reset({
      ...values,
      apiKey: '',
      makeDefault: false,
    })
    setSelectedProvider(values.provider)
    onSuccess?.()
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Provider</label>
        <Select
          value={selectedProvider}
          onValueChange={(next) => {
            const typed = next as FormValues['provider']
            setSelectedProvider(typed)
            form.setValue('provider', typed, { shouldValidate: true, shouldDirty: true })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className="flex-col items-start gap-0"
              >
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
            {...form.register('displayName')}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">API Key</label>
        <Textarea
          placeholder="sk-..."
          {...form.register('apiKey')}
        />
        {form.formState.errors.apiKey && (
          <p className="text-xs text-destructive">{form.formState.errors.apiKey.message}</p>
        )}
      </div>

      {variant === 'default' ? (
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Preferred model</label>
          <Input
            placeholder="gpt-4o-mini"
            {...form.register('defaultModel')}
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          {...form.register('makeDefault')}
        />
        Make this the default provider
      </label>

      <Button
        className="w-full"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? 'Saving...' : 'Save provider'}
      </Button>
    </form>
  )
}

