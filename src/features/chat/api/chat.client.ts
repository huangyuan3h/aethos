import { invoke } from '@tauri-apps/api/core'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

interface InvokeChatResponse {
  reply: string
  model: string
}

export async function sendChat(prompt: string, model?: string): Promise<InvokeChatResponse> {
  return invoke<InvokeChatResponse>('invoke_chat', {
    request: { prompt, model },
  })
}

