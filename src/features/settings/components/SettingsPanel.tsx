import { useMemo, useState } from 'react'

import { useSettingsStore } from '../state/settings.store'
import { ProviderForm } from './ProviderForm'
import { ProviderList } from './ProviderList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { McpSettings } from '@/features/mcp/components/McpSettings'
import { cn } from '@/lib/utils'
import { GeneralSettings } from './GeneralSettings'
import { useI18n } from '@/i18n/I18nProvider'

export function SettingsPanel() {
  const isOpen = useSettingsStore((state) => state.isSettingsOpen)
  const close = useSettingsStore((state) => state.closeSettings)
  const onboardingNeeded = useSettingsStore((state) => state.onboardingNeeded)
  const { t } = useI18n()
  const sections = useMemo(
    () => [
      {
        id: 'general' as SettingsSection,
        label: t('settings.nav.general.label'),
        description: t('settings.nav.general.description'),
      },
      {
        id: 'theme' as SettingsSection,
        label: t('settings.nav.theme.label'),
        description: t('settings.nav.theme.description'),
      },
      {
        id: 'providers' as SettingsSection,
        label: t('settings.nav.providers.label'),
        description: t('settings.nav.providers.description'),
      },
      {
        id: 'mcp' as SettingsSection,
        label: t('settings.nav.mcp.label'),
        description: t('settings.nav.mcp.description'),
      },
    ],
    [t],
  )
  const [view, setView] = useState<SettingsSection>('providers')

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 px-6 py-8 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-6xl gap-8 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-2xl">
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border/60 pr-4">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {t('settings.header.kicker')}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {t(`settings.header.sectionTitle.${view}` as const)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(`settings.header.sectionDescription.${view}` as const)}
              </p>
            </div>
            <nav className="mt-6 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setView(section.id)}
                  className={cn(
                    'w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm transition',
                    view === section.id
                      ? 'border-primary/40 bg-primary/10 text-primary-foreground'
                      : 'hover:border-border/80 hover:bg-card',
                  )}
                >
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </button>
              ))}
            </nav>
          </div>
          {!onboardingNeeded ? (
            <Button
              variant="ghost"
              onClick={close}
            >
              {t('common.actions.close', { defaultValue: 'Close' })}
            </Button>
          ) : null}
        </aside>

        <section className="flex-1 overflow-y-auto">
          {view === 'general' ? (
            <GeneralSettings />
          ) : view === 'theme' ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.nav.theme.label')}</CardTitle>
                <CardDescription>{t('settings.theme.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('settings.theme.description')}</p>
              </CardContent>
            </Card>
          ) : view === 'providers' ? (
            <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>{t('settings.providers.addTitle')}</CardTitle>
                  <CardDescription>{t('settings.providers.addDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderForm />
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t('settings.providers.listTitle')}</CardTitle>
                  <CardDescription>{t('settings.providers.listDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderList />
                </CardContent>
              </Card>
            </div>
          ) : (
            <McpSettings />
          )}
        </section>
      </div>
    </div>
  )
}

type SettingsSection = 'general' | 'theme' | 'providers' | 'mcp'

