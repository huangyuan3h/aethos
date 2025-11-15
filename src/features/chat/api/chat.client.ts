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

export interface ChatStreamChunk {
  conversationId: string
  delta: string
  done: boolean
  model?: string
}

export async function sendChat(prompt: string, model?: string): Promise<InvokeChatResponse> {
  return invoke<InvokeChatResponse>('invoke_chat', {
    request: { prompt, model },
  })
}

export async function streamChat(
  conversationId: string,
  prompt: string,
  model?: string,
): Promise<void> {
  await invoke('stream_chat', {
    request: { prompt, model, conversationId },
  })
}

