export type ProviderId = 'openai' | 'openrouter' | 'anthropic' | 'google'

export interface ProviderSummary {
  id: number
  provider: ProviderId
  displayName: string
  defaultModel?: string | null
  isDefault: boolean
  hasApiKey: boolean
}

export interface ProviderUpsertPayload {
  provider: ProviderId
  displayName: string
  apiKey: string
  defaultModel?: string
  makeDefault: boolean
}

