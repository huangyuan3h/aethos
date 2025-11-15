import { useSettingsStore } from '../state/settings.store'
import { Button } from '@/components/ui/button'

export function ProviderList() {
  const providers = useSettingsStore((state) => state.providers)
  const setDefault = useSettingsStore((state) => state.setDefaultProvider)

  if (providers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No providers configured yet. Add a key to start chatting.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
        >
          <div>
            <p className="font-medium text-foreground">
              {provider.displayName}
              {provider.isDefault ? (
                <span className="ml-2 text-xs font-semibold text-primary">Default</span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {provider.defaultModel ?? 'No preferred model set'}
            </p>
          </div>
          {!provider.isDefault ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDefault(provider.provider)}
            >
              Set default
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

