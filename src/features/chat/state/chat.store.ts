import { create } from 'zustand'
import { nanoid } from 'nanoid'

import { sendChat, type ChatMessage } from '../api/chat.client'

type MessageStatus = 'pending' | 'sent' | 'error'

interface ChatState {
  messages: Array<ChatMessage & { status: MessageStatus }>
  isSending: boolean
  error?: string
  sendMessage: (content: string) => Promise<void>
  clear: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isSending: false,
  async sendMessage(content) {
    if (!content.trim() || get().isSending) {
      return
    }
    const userMessage: ChatMessage & { status: MessageStatus } = {
      id: nanoid(),
      role: 'user',
      content,
      createdAt: Date.now(),
      status: 'sent',
    }
    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      error: undefined,
    }))
    try {
      const response = await sendChat(content)
      const assistantMessage: ChatMessage & { status: MessageStatus } = {
        id: nanoid(),
        role: 'assistant',
        content: response.reply,
        createdAt: Date.now(),
        status: 'sent',
      }
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isSending: false,
      }))
    } catch (error) {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg,
        ),
        isSending: false,
        error: (error as Error).message,
      }))
    }
  },
  clear() {
    set({ messages: [], error: undefined })
  },
}))

