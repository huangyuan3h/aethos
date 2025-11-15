import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import { streamChat, type ChatMessage, type ChatStreamChunk } from '../api/chat.client'
import { getConversationMessages } from '../api/history.client'
import { useChatHistoryStore } from './history.store'
import { usePreferencesStore } from '@/features/preferences/state/preferences.store'

type MessageStatus = 'pending' | 'sent' | 'error'

interface ChatState {
  activeConversationId?: string
  messages: Array<ChatMessage & { status: MessageStatus; conversationId?: string }>
  isStreaming: boolean
  error?: string
  sendMessage: (content: string) => Promise<void>
  loadConversation: (conversationId: string) => Promise<void>
  prepareConversation: (conversationId: string) => void
  clear: () => void
}

const isDev = import.meta.env.DEV

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: undefined,
  messages: [],
  isStreaming: false,
  async sendMessage(content) {
    if (!content.trim() || get().isStreaming) {
      return
    }
    const conversationId = get().activeConversationId
    if (!conversationId) {
      set({ error: 'No conversation selected' })
      return
    }
    const systemPrompt = usePreferencesStore.getState().systemPrompt
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
    useChatHistoryStore
      .getState()
      .updateConversationSnapshot(conversationId, content, new Date().toISOString())

    let unlisten: UnlistenFn | undefined
    try {
      let assistantCompleted = ''
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
            if (!payload.done) {
              assistantCompleted = nextContent
            }
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
          const currentAssistant =
            get().messages.find((msg) => msg.id === assistantId)?.content ??
            assistantCompleted
          useChatHistoryStore
            .getState()
            .updateConversationSnapshot(
              conversationId,
              currentAssistant,
              new Date().toISOString(),
            )
        }
      })
      await streamChat(conversationId, content, systemPrompt)
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
  async loadConversation(conversationId) {
    set({ isStreaming: false, error: undefined })
    try {
      const history = await getConversationMessages(conversationId)
      const mapped = history.map((message) => {
        const timestamp = Date.parse(message.createdAt)
        return {
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: Number.isNaN(timestamp) ? Date.now() : timestamp,
          status: 'sent' as MessageStatus,
          conversationId: message.conversationId,
        }
      })
      set({
        activeConversationId: conversationId,
        messages: mapped,
      })
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  prepareConversation(conversationId) {
    set({
      activeConversationId: conversationId,
      messages: [],
      isStreaming: false,
      error: undefined,
    })
  },
  clear() {
    set({ messages: [], error: undefined, activeConversationId: undefined })
  },
}))

