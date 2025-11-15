import { invoke } from '@tauri-apps/api/core'

export interface ConversationSummary {
  id: string
  title: string
  pinned: boolean
  lastMessagePreview?: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return invoke<ConversationSummary[]>('list_conversations')
}

export async function createConversation(title?: string): Promise<ConversationSummary> {
  return invoke<ConversationSummary>('create_conversation', { title })
}

export async function renameConversation(id: string, title: string): Promise<ConversationSummary> {
  return invoke<ConversationSummary>('rename_conversation', { id, title })
}

export async function pinConversation(id: string, pinned: boolean): Promise<ConversationSummary> {
  return invoke<ConversationSummary>('pin_conversation', { id, pinned })
}

export async function deleteConversation(id: string): Promise<void> {
  await invoke('delete_conversation', { id })
}

export async function getConversationMessages(
  id: string,
  limit?: number,
): Promise<ConversationMessage[]> {
  return invoke<ConversationMessage[]>('get_conversation_messages', { id, limit })
}

