import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = async () => {
    if (!value.trim()) {
      return
    }
    await onSend(value)
    setValue('')
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card/80 p-4">
      <Textarea
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask Aethos anything..."
      />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSend}
          disabled={disabled}
        >
          Send
        </Button>
      </div>
    </div>
  )
}

