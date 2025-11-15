import { useEffect, useMemo, useState } from 'react'
import { MoreHorizontal, Pin, PinOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useChatHistoryStore } from '../state/history.store'
import { useChatStore } from '../state/chat.store'

function formatTimestamp(value?: string) {
  if (!value) {
    return 'No activity yet'
  }
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatHistoryPanel() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const conversations = useChatHistoryStore((state) => state.conversations)
  const loading = useChatHistoryStore((state) => state.loading)
  const error = useChatHistoryStore((state) => state.error)
  const loadConversations = useChatHistoryStore((state) => state.loadConversations)
  const createConversation = useChatHistoryStore((state) => state.createConversation)
  const renameConversation = useChatHistoryStore((state) => state.renameConversation)
  const togglePin = useChatHistoryStore((state) => state.togglePin)
  const deleteConversation = useChatHistoryStore((state) => state.deleteConversation)

  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const loadConversation = useChatStore((state) => state.loadConversation)
  const prepareConversation = useChatStore((state) => state.prepareConversation)
  const clearConversation = useChatStore((state) => state.clear)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!loading && conversations.length > 0 && !activeConversationId) {
      loadConversation(conversations[0].id).catch((err) => console.error(err))
    }
  }, [activeConversationId, conversations, loadConversation, loading])

  const handleNewChat = async () => {
    if (isCreating) {
      return
    }
    setIsCreating(true)
    try {
      const conversation = await createConversation()
      prepareConversation(conversation.id)
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelect = async (conversationId: string) => {
    if (editingId === conversationId) {
      return
    }
    if (conversationId === activeConversationId) {
      return
    }
    try {
      await loadConversation(conversationId)
    } catch (err) {
      console.error(err)
    }
  }

  const startRename = (id: string, title: string) => {
    setEditingId(id)
    setEditingValue(title)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingValue('')
  }

  const submitRename = async (id: string) => {
    const nextTitle = editingValue.trim()
    if (!nextTitle) {
      return
    }
    try {
      await renameConversation(id, nextTitle)
      cancelRename()
    } catch (err) {
      console.error(err)
    }
  }

  const handleTogglePin = async (id: string, current: boolean) => {
    try {
      console.debug('[history] togglePin', { id, next: !current })
      await togglePin(id, !current)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    const fallback = conversations.find((conversation) => conversation.id !== id)
    try {
      console.debug('[history] deleteConversation', { id })
      await deleteConversation(id)
      if (activeConversationId === id) {
        if (fallback) {
          await loadConversation(fallback.id)
        } else {
          clearConversation()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const hasConversations = conversations.length > 0
  const placeholderLabel = useMemo(() => {
    if (loading) {
      return 'Loading conversations...'
    }
    if (error) {
      return error
    }
    return 'Create your first conversation'
  }, [error, loading])

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">History</p>
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        <Button
          size="sm"
          onClick={handleNewChat}
          disabled={isCreating}
        >
          New chat
        </Button>
      </div>

      {error && hasConversations ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
      <div className="mt-4 flex-1">
        {!hasConversations ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            <p>{placeholderLabel}</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-3">
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId
                return (
                  <div
                    key={conversation.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(conversation.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleSelect(conversation.id)
                      }
                    }}
                    className={cn(
                      'group w-full rounded-2xl border px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary-foreground'
                        : 'border-border bg-background/50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {editingId === conversation.id ? 'Rename conversation' : conversation.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {conversation.pinned ? (
                          <Pin className="h-4 w-4 text-primary" />
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault()
                                startRename(conversation.id, conversation.title)
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault()
                                handleTogglePin(conversation.id, conversation.pinned)
                              }}
                            >
                              {conversation.pinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(event) => {
                                event.preventDefault()
                                handleDelete(conversation.id)
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {editingId === conversation.id ? (
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault()
                          submitRename(conversation.id)
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Input
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          placeholder="Conversation title"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            type="submit"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              cancelRename()
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {conversation.lastMessagePreview ?? 'Empty conversation'}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {formatTimestamp(conversation.lastMessageAt ?? conversation.updatedAt)}
                          </span>
                          {conversation.pinned ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Pin className="h-3 w-3" />
                              Pinned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <PinOff className="h-3 w-3" />
                              Not pinned
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

