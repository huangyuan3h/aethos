import type { ProviderId } from './types'

export const PROVIDER_OPTIONS: Array<{
  id: ProviderId
  label: string
  hint: string
  defaultModel?: string
}> = [
  {
    id: 'openai',
    label: 'OpenAI',
    hint: 'Use models such as GPT-4o, o1, o3.',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    hint: 'Route across multiple model vendors with one key.',
    defaultModel: 'google/gemini-flash-1.5',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    hint: 'Claude 3.5 Sonnet, 3.5 Haiku, etc.',
    defaultModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'google',
    label: 'Google (Gemini)',
    hint: 'Gemini Flash/Pro models.',
    defaultModel: 'gemini-1.5-flash',
  },
]

