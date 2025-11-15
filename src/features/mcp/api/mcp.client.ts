import { invoke } from '@tauri-apps/api/core'

export interface McpSource {
  id: number
  slug: string
  name: string
  kind: string
  endpoint?: string | null
  priority: number
  lastSyncedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface McpSourcePayload {
  slug: string
  name: string
  kind?: string
  endpoint?: string
  priority?: number
}

export interface McpRegistryEntry {
  id: number
  slug: string
  name: string
  version: string
  summary?: string | null
  author?: string | null
  homepage?: string | null
  tags?: string | null
  manifest: string
  checksum?: string | null
  sourceSlug?: string | null
  syncedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface McpRegistryPayload {
  slug: string
  name: string
  version: string
  summary?: string
  author?: string
  homepage?: string
  tags?: string[]
  manifest: unknown
  checksum?: string
  sourceSlug?: string
}

export interface McpServer {
  id: number
  slug: string
  name: string
  installedVersion?: string | null
  status: string
  installPath?: string | null
  autoStart: boolean
  config?: string | null
  lastHealthCheck?: string | null
  createdAt: string
  updatedAt: string
}

export interface McpServerPayload {
  slug: string
  name: string
  installedVersion?: string
  status?: string
  installPath?: string
  autoStart?: boolean
  config?: unknown
  secrets?: unknown
}

export function listMcpSources() {
  return invoke<McpSource[]>('list_mcp_sources')
}

export function upsertMcpSource(payload: McpSourcePayload) {
  return invoke<McpSource>('upsert_mcp_source', { payload })
}

export function deleteMcpSource(slug: string) {
  return invoke<void>('delete_mcp_source', { slug })
}

export function listMcpRegistry() {
  return invoke<McpRegistryEntry[]>('list_mcp_registry')
}

export function listMcpServers() {
  return invoke<McpServer[]>('list_mcp_servers')
}

export function upsertMcpServer(payload: McpServerPayload) {
  return invoke<McpServer>('upsert_mcp_server', { payload })
}

export function deleteMcpServer(slug: string) {
  return invoke<void>('delete_mcp_server', { slug })
}

export function updateMcpServerStatus(slug: string, status: string) {
  return invoke<McpServer>('update_mcp_server_status', { slug, status })
}

