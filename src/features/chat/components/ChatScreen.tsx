import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useChatStore } from '../state/chat.store'
import { ChatInput } from './ChatInput'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ChatScreen() {
  const messages = useChatStore((state) => state.messages)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const isStreaming = useChatStore((state) => state.isStreaming)
  const error = useChatStore((state) => state.error)

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-background p-6">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl border px-4 py-2 text-sm ${
                  message.role === 'user'
                    ? 'border-primary/40 bg-primary/10 text-primary-foreground'
                    : 'border-border bg-card text-card-foreground display-markdown'
                } ${message.status === 'error' ? 'border-destructive text-destructive' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-invert max-w-none text-sm"
                  >
                    {message.content || '...'}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <ChatInput
        disabled={isStreaming}
        onSend={sendMessage}
      />
    </div>
  )
}

