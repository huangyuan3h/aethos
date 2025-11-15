import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import { streamChat, type ChatMessage, type ChatStreamChunk } from '../api/chat.client'

type MessageStatus = 'pending' | 'sent' | 'error'

interface ChatState {
  messages: Array<ChatMessage & { status: MessageStatus; conversationId?: string }>
  isStreaming: boolean
  error?: string
  sendMessage: (content: string) => Promise<void>
  clear: () => void
}

const isDev = import.meta.env.DEV

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  async sendMessage(content) {
    if (!content.trim() || get().isStreaming) {
      return
    }
    const conversationId = nanoid()
    if (isDev) {
      console.debug('[chat] sendMessage', { conversationId, content })
    }
    const userMessage: ChatMessage & { status: MessageStatus } = {
      id: nanoid(),
      role: 'user',
      content,
      createdAt: Date.now(),
      status: 'sent',
    }
    const assistantId = nanoid()
    const assistantMessage: ChatMessage & { status: MessageStatus; conversationId: string } = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now() + 1,
      status: 'pending',
      conversationId,
    }
    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      error: undefined,
    }))

    let unlisten: UnlistenFn | undefined
    try {
      unlisten = await listen<ChatStreamChunk>('chat:chunk', (event) => {
        const payload = event.payload
        if (isDev) {
          console.debug('[chat] chunk', payload)
        }
        if (payload.conversationId !== conversationId) {
          return
        }
        set((state) => ({
          messages: state.messages.map((msg) => {
            if (msg.id !== assistantId) {
              return msg
            }
            const nextContent = payload.done ? msg.content : `${msg.content}${payload.delta}`
            return {
              ...msg,
              content: nextContent,
              status: payload.done ? 'sent' : 'pending',
            }
          }),
          isStreaming: payload.done ? false : state.isStreaming,
        }))
        if (payload.done && unlisten) {
          unlisten()
        }
      })
      await streamChat(conversationId, content)
    } catch (error) {
      if (isDev) {
        console.debug('[chat] stream error', error)
      }
      if (unlisten) {
        unlisten()
      }
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantId ? { ...msg, status: 'error' } : msg,
        ),
        isStreaming: false,
        error: (error as Error).message,
      }))
    }
  },
  clear() {
    set({ messages: [], error: undefined })
  },
}))

