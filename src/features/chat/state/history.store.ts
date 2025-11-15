import { create } from 'zustand'

import {
  createConversation as createConversationApi,
  deleteConversation as deleteConversationApi,
  listConversations,
  pinConversation,
  renameConversation as renameConversationApi,
  type ConversationSummary,
} from '../api/history.client'

function sortConversations(items: ConversationSummary[]): ConversationSummary[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    const aTime = Date.parse(a.lastMessageAt ?? a.updatedAt ?? a.createdAt) || 0
    const bTime = Date.parse(b.lastMessageAt ?? b.updatedAt ?? b.createdAt) || 0
    return bTime - aTime
  })
}

interface ChatHistoryState {
  conversations: ConversationSummary[]
  loading: boolean
  error?: string
  loadConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<ConversationSummary>
  renameConversation: (id: string, title: string) => Promise<ConversationSummary>
  togglePin: (id: string, pinned: boolean) => Promise<ConversationSummary>
  deleteConversation: (id: string) => Promise<void>
  updateConversationSnapshot: (id: string, preview: string, timestamp?: string) => void
}

export const useChatHistoryStore = create<ChatHistoryState>((set) => ({
  conversations: [],
  loading: false,
  error: undefined,
  async loadConversations() {
    set({ loading: true, error: undefined })
    try {
      const items = await listConversations()
      console.debug('[history.store] loadConversations', { count: items.length })
      set({ conversations: sortConversations(items), loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  async createConversation(title) {
    try {
      const conversation = await createConversationApi(title)
      console.debug('[history.store] createConversation', conversation)
      set((state) => ({
        conversations: sortConversations([conversation, ...state.conversations]),
      }))
      return conversation
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async renameConversation(id, title) {
    try {
      console.debug('[history.store] renameConversation -> request', { id, title })
      const updated = await renameConversationApi(id, title)
      console.debug('[history.store] renameConversation -> response', updated)
      set((state) => ({
        conversations: sortConversations(
          state.conversations.map((c) => (c.id === id ? updated : c)),
        ),
      }))
      return updated
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async togglePin(id, pinned) {
    try {
      console.debug('[history.store] togglePin -> request', { id, pinned })
      const updated = await pinConversation(id, pinned)
      console.debug('[history.store] togglePin -> response', updated)
      set((state) => ({
        conversations: sortConversations(
          state.conversations.map((c) => (c.id === id ? updated : c)),
        ),
      }))
      return updated
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async deleteConversation(id) {
    try {
      console.debug('[history.store] deleteConversation -> request', { id })
      await deleteConversationApi(id)
      console.debug('[history.store] deleteConversation -> success', { id })
      set((state) => ({
        conversations: state.conversations.filter((conversation) => conversation.id != id),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  updateConversationSnapshot(id, preview, timestamp) {
    const iso = timestamp ?? new Date().toISOString()
    console.debug('[history.store] snapshot', { id, preview, timestamp: iso })
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                lastMessagePreview: preview,
                lastMessageAt: iso,
                updatedAt: iso,
              }
            : conversation,
        ),
      ),
    }))
  },
}))

