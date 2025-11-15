import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { useMcpStore } from '../state/mcp.store'

export function McpSettings() {
  const {
    sources,
    servers,
    registry,
    loading,
    loadAll,
    addSource,
    removeSource,
    addServer,
    removeServer,
    setServerStatus,
  } = useMcpStore()
  const [sourceForm, setSourceForm] = useState({ slug: '', name: '', endpoint: '' })
  const [serverForm, setServerForm] = useState({ slug: '', name: '', installedVersion: '' })
  const [isSubmitting, setIsSubmitting] = useState<'source' | 'server' | null>(null)

  useEffect(() => {
    loadAll().catch((error) => console.error('[mcp] loadAll failed', error))
  }, [loadAll])

  const handleSourceSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!sourceForm.slug.trim() || !sourceForm.name.trim()) {
      return
    }
    setIsSubmitting('source')
    try {
      await addSource({
        slug: sourceForm.slug.trim(),
        name: sourceForm.name.trim(),
        endpoint: sourceForm.endpoint.trim() || undefined,
      })
      setSourceForm({ slug: '', name: '', endpoint: '' })
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleServerSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!serverForm.slug.trim() || !serverForm.name.trim()) {
      return
    }
    setIsSubmitting('server')
    try {
      await addServer({
        slug: serverForm.slug.trim(),
        name: serverForm.name.trim(),
        installedVersion: serverForm.installedVersion.trim() || undefined,
      })
      setServerForm({ slug: '', name: '', installedVersion: '' })
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">MCP marketplace</h2>
          <p className="text-sm text-muted-foreground">
            Manage Model Context Protocol sources, registry entries, and installed servers.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadAll().catch(console.error)}
          disabled={loading}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh data
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Add or remove marketplace endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={handleSourceSubmit}
            >
            <div>
              <Label htmlFor="mcp-source-slug">Slug</Label>
              <Input
                id="mcp-source-slug"
                value={sourceForm.slug}
                onChange={(event) => setSourceForm((form) => ({ ...form, slug: event.target.value }))}
                placeholder="official-market"
                required
              />
            </div>
            <div>
              <Label htmlFor="mcp-source-name">Display name</Label>
              <Input
                id="mcp-source-name"
                value={sourceForm.name}
                onChange={(event) => setSourceForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="Official marketplace"
                required
              />
            </div>
            <div>
              <Label htmlFor="mcp-source-endpoint">Endpoint (optional)</Label>
              <Input
                id="mcp-source-endpoint"
                value={sourceForm.endpoint}
                onChange={(event) =>
                  setSourceForm((form) => ({ ...form, endpoint: event.target.value }))
                }
                placeholder="https://example.com/manifest.json"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting === 'source'}
            >
              {isSubmitting === 'source' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save source'
              )}
            </Button>
          </form>
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.slug}
                  className="rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{source.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSource(source.slug).catch(console.error)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{source.endpoint ?? '—'}</p>
                </div>
              ))}
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sources configured yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installed servers</CardTitle>
            <CardDescription>Register downloaded MCP servers and manage runtime state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={handleServerSubmit}
            >
            <div>
              <Label htmlFor="mcp-server-slug">Slug</Label>
              <Input
                id="mcp-server-slug"
                value={serverForm.slug}
                onChange={(event) => setServerForm((form) => ({ ...form, slug: event.target.value }))}
                placeholder="filesystem-tools"
                required
              />
            </div>
            <div>
              <Label htmlFor="mcp-server-name">Display name</Label>
              <Input
                id="mcp-server-name"
                value={serverForm.name}
                onChange={(event) => setServerForm((form) => ({ ...form, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="mcp-server-version">Version</Label>
              <Input
                id="mcp-server-version"
                value={serverForm.installedVersion}
                onChange={(event) =>
                  setServerForm((form) => ({ ...form, installedVersion: event.target.value }))
                }
                placeholder="1.0.0"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting === 'server'}
            >
              {isSubmitting === 'server' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Register server'
              )}
            </Button>
          </form>

            <div className="space-y-3">
              {servers.map((server) => (
                <div
                  key={server.slug}
                  className="rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {server.installedVersion ?? 'unknown'} · {server.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setServerStatus(server.slug, server.status === 'running' ? 'stopped' : 'running')
                        }
                      >
                        {server.status === 'running' ? 'Stop' : 'Start'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeServer(server.slug).catch(console.error)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {servers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No servers installed yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
          <CardDescription>Entries synced from configured sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {registry.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Registry is empty. Add a source and refresh to populate entries.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {registry.map((entry) => (
                <div
                  key={`${entry.slug}@${entry.version}`}
                  className="rounded-xl border border-border/60 p-3"
                >
                  <p className="font-semibold">
                    {entry.name}{' '}
                    <span className="text-xs text-muted-foreground">v{entry.version}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{entry.summary ?? 'No summary provided.'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source: {entry.sourceSlug ?? 'manual'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

