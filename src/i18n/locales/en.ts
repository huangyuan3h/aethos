export const en = {
  app: {
    hero: {
      kicker: 'Aethos / Personal AI Workspace',
      headlineReady: 'Workspace is ready',
      headlineConnect: 'Connect an AI provider',
      descriptionReady: 'Default provider: {{provider}}.',
      descriptionConnect: 'Bring your own API key to unlock conversations and workflows.',
      button: 'Manage providers',
      cardTitle: "You're almost there",
      cardBody:
        'Add at least one API key (OpenAI, OpenRouter, Anthropic, Gemini) to begin chatting and calling MCP tools.',
      cardCTA: 'Configure provider',
    },
  },
  settings: {
    header: {
      kicker: 'Settings',
      sectionTitle: {
        general: 'General preferences',
        theme: 'Theme',
        providers: 'AI providers',
        mcp: 'Model Context Protocol',
      },
      sectionDescription: {
        general: 'Language, prompts and workspace defaults.',
        theme: 'Control appearance and typography.',
        providers: 'Bring your own API keys. Everything stays on this device.',
        mcp: 'Configure MCP sources and installed servers.',
      },
    },
    nav: {
      general: { label: 'General', description: 'Language & prompts' },
      theme: { label: 'Theme', description: 'Appearance' },
      providers: { label: 'Providers', description: 'AI credentials' },
      mcp: { label: 'MCP', description: 'Context servers' },
    },
    general: {
      language: {
        title: 'Language',
        description: 'Select the interface language for Aethos.',
        placeholder: 'Select language',
      },
      systemPrompt: {
        title: 'System prompt',
        description:
          'Customize how Aethos introduces itself in every conversation. Leave empty for default behavior.',
        placeholder: 'e.g. You are Aethos, a bilingual AI workspace assistant...',
      },
      saveButton: 'Save changes',
    },
    theme: {
      description: 'Theme customization will be available in a future update.',
    },
    providers: {
      addTitle: 'Add provider',
      addDescription: 'Save OpenAI, OpenRouter, Anthropic or other compatible keys with encryption.',
      listTitle: 'Connected providers',
      listDescription: 'Choose a default model or remove providers you no longer need.',
    },
    mcp: {
      headerTitle: 'MCP marketplace',
      headerDescription: 'Manage Model Context Protocol sources, registry entries and servers.',
      refresh: 'Refresh data',
      sources: {
        title: 'Sources',
        description: 'Add or remove marketplace endpoints.',
        empty: 'No sources configured yet.',
        saveButton: 'Save source',
      },
      installed: {
        title: 'Installed servers',
        description: 'Register downloaded MCP servers and manage runtime state.',
        empty: 'No servers installed yet.',
        registerButton: 'Register server',
        start: 'Start',
        stop: 'Stop',
      },
      registry: {
        title: 'Registry',
        description: 'Entries synced from configured sources.',
        empty: 'Registry is empty. Add a source and refresh to populate entries.',
      },
    },
  },
  providerForm: {
    placeholders: {
      provider: 'Choose a provider',
      displayName: 'OpenAI',
      apiKey: 'sk-...',
      model: 'gpt-4o-mini',
    },
    labels: {
      provider: 'Provider',
      displayName: 'Display name',
      apiKey: 'API key',
      model: 'Preferred model',
    },
    makeDefault: 'Make this the default provider',
    actions: {
      save: 'Save provider',
    },
    errors: {
      shortKey: 'API key looks too short.',
    },
  },
  providerList: {
    empty: 'No providers configured yet. Add a key to start chatting.',
    defaultBadge: 'Default',
    noModel: 'No preferred model set',
    setDefault: 'Set default',
  },
  mcp: {
    sources: {
      endpoint: 'https://example.com/manifest.json',
    },
    servers: {
      slugPlaceholder: 'filesystem-tools',
      namePlaceholder: 'Filesystem tools',
      versionPlaceholder: '1.0.0',
    },
  },
  common: {
    actions: {
      saving: 'Saving...',
      close: 'Close',
    },
  },
  onboarding: {
    kicker: 'Welcome',
    title: "Let's personalize Aethos",
    description:
      'Choose your language, theme and connect your first AI provider. Keys always stay on this device.',
    steps: {
      language: 'Language',
      theme: 'Theme',
      provider: 'AI provider',
    },
    language: {
      title: 'Choose your language',
      description: 'This controls the interface language. You can change it later in settings.',
    },
    theme: {
      title: 'Select a theme',
      description: 'Pick the default look and feel. You can switch later.',
    },
    provider: {
      title: 'Connect an AI provider',
      description: 'Add at least one API key to start chatting.',
    },
    buttons: {
      next: 'Next',
      back: 'Back',
      skip: 'Skip for now',
    },
  },
} as const

