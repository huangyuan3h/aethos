import { create } from 'zustand'

import {
  deleteMcpServer,
  deleteMcpSource,
  listMcpRegistry,
  listMcpServers,
  listMcpSources,
  type McpRegistryEntry,
  type McpServer,
  type McpServerPayload,
  type McpSource,
  type McpSourcePayload,
  upsertMcpServer,
  upsertMcpSource,
  updateMcpServerStatus,
} from '../api/mcp.client'

interface McpState {
  sources: McpSource[]
  servers: McpServer[]
  registry: McpRegistryEntry[]
  loading: boolean
  error?: string
  loadAll: () => Promise<void>
  addSource: (payload: McpSourcePayload) => Promise<void>
  removeSource: (slug: string) => Promise<void>
  addServer: (payload: McpServerPayload) => Promise<void>
  removeServer: (slug: string) => Promise<void>
  setServerStatus: (slug: string, status: string) => Promise<void>
}

export const useMcpStore = create<McpState>((set) => ({
  sources: [],
  servers: [],
  registry: [],
  loading: false,
  async loadAll() {
    set({ loading: true, error: undefined })
    try {
      const [sources, servers, registry] = await Promise.all([
        listMcpSources(),
        listMcpServers(),
        listMcpRegistry(),
      ])
      set({
        sources,
        servers,
        registry,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  async addSource(payload) {
    try {
      const source = await upsertMcpSource(payload)
      set((state) => ({
        sources: [...state.sources.filter((item) => item.slug !== source.slug), source].sort(
          (a, b) => a.priority - b.priority,
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async removeSource(slug) {
    try {
      await deleteMcpSource(slug)
      set((state) => ({
        sources: state.sources.filter((source) => source.slug !== slug),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async addServer(payload) {
    try {
      const server = await upsertMcpServer(payload)
      set((state) => ({
        servers: [...state.servers.filter((item) => item.slug !== server.slug), server].sort(
          (a, b) => a.name.localeCompare(b.name),
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async removeServer(slug) {
    try {
      await deleteMcpServer(slug)
      set((state) => ({
        servers: state.servers.filter((server) => server.slug !== slug),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
  async setServerStatus(slug, status) {
    try {
      const server = await updateMcpServerStatus(slug, status)
      set((state) => ({
        servers: state.servers.map((item) => (item.slug === slug ? server : item)),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
}))

