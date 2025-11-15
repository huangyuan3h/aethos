import type { TranslationDictionary } from '../types'

export const frFR = {
  app: {
    hero: {
      kicker: 'Aethos / Espace de travail IA personnel',
      headlineReady: "L’espace est prêt",
      headlineConnect: 'Connectez un fournisseur IA',
      descriptionReady: 'Fournisseur par défaut : {{provider}}.',
      descriptionConnect:
        'Apportez votre propre clé API pour activer les conversations et les flux de travail.',
      button: 'Gérer les fournisseurs',
      cardTitle: 'Presque terminé',
      cardBody:
        'Ajoutez au moins une clé API (OpenAI, OpenRouter, Anthropic, Gemini) pour commencer à discuter et à utiliser les outils MCP.',
      cardCTA: 'Configurer un fournisseur',
    },
  },
  settings: {
    header: {
      kicker: 'Paramètres',
      sectionTitle: {
        general: 'Préférences générales',
        theme: 'Thème',
        providers: 'Fournisseurs IA',
        mcp: 'Model Context Protocol',
      },
      sectionDescription: {
        general: 'Langue, invites et comportements par défaut.',
        theme: 'Contrôlez couleurs et typographie.',
        providers: 'Gérez vos clés API en toute sécurité en local.',
        mcp: 'Configurez les sources MCP et les serveurs installés.',
      },
    },
    nav: {
      general: { label: 'Général', description: 'Langue & invites' },
      theme: { label: 'Thème', description: 'Apparence' },
      providers: { label: 'Fournisseurs', description: 'Identifiants IA' },
      mcp: { label: 'MCP', description: 'Serveurs de contexte' },
    },
    general: {
      language: {
        title: 'Langue',
        description: 'Choisissez la langue de l’interface.',
        placeholder: 'Sélectionner la langue',
      },
      systemPrompt: {
        title: 'Invite système',
        description:
          'Personnalisez la manière dont Aethos se présente dans chaque conversation. Laissez vide pour utiliser la valeur par défaut.',
        placeholder: 'ex. : Vous êtes Aethos, un assistant IA bilingue…',
      },
      saveButton: 'Enregistrer',
    },
    theme: {
      description: 'La personnalisation du thème arrive bientôt.',
    },
    providers: {
      addTitle: 'Ajouter un fournisseur',
      addDescription:
        'Enregistrez en toute sécurité les clés OpenAI, OpenRouter, Anthropic et plus encore.',
      listTitle: 'Fournisseurs connectés',
      listDescription: 'Choisissez un modèle par défaut ou supprimez ceux qui ne sont plus utiles.',
    },
    mcp: {
      headerTitle: 'Marché MCP',
      headerDescription:
        'Gérez les sources, le registre et les serveurs installés pour Model Context Protocol.',
      refresh: 'Actualiser',
      sources: {
        title: 'Sources',
        description: 'Ajoutez ou supprimez des points de terminaison du marché.',
        empty: 'Aucune source configurée pour le moment.',
        saveButton: 'Enregistrer la source',
      },
      installed: {
        title: 'Serveurs installés',
        description: 'Déclarez vos serveurs MCP locaux et gérez leur état.',
        empty: 'Aucun serveur installé.',
        registerButton: 'Enregistrer le serveur',
        start: 'Démarrer',
        stop: 'Arrêter',
      },
      registry: {
        title: 'Registre',
        description: 'Entrées synchronisées depuis vos sources.',
        empty: 'Le registre est vide. Ajoutez une source puis actualisez pour récupérer des entrées.',
      },
    },
  },
  providerForm: {
    placeholders: {
      provider: 'Choisir un fournisseur',
      displayName: 'OpenAI',
      apiKey: 'sk-...',
      model: 'gpt-4o-mini',
    },
    labels: {
      provider: 'Fournisseur',
      displayName: 'Nom affiché',
      apiKey: 'Clé API',
      model: 'Modèle préféré',
    },
    makeDefault: 'Définir comme fournisseur par défaut',
    actions: {
      save: 'Enregistrer le fournisseur',
    },
    errors: {
      shortKey: 'La clé API semble trop courte.',
    },
  },
  providerList: {
    empty: 'Aucun fournisseur configuré. Ajoutez une clé pour commencer.',
    defaultBadge: 'Défaut',
    noModel: 'Aucun modèle préféré',
    setDefault: 'Définir par défaut',
  },
  mcp: {
    sources: {
      endpoint: 'https://example.com/manifest.json',
    },
    servers: {
      slugPlaceholder: 'filesystem-tools',
      namePlaceholder: 'Outils système de fichiers',
      versionPlaceholder: '1.0.0',
    },
  },
  common: {
    actions: {
      saving: 'Enregistrement…',
      close: 'Fermer',
    },
  },
  onboarding: {
    kicker: 'Bienvenue',
    title: 'Personnalisons Aethos',
    description:
      'Choisissez la langue, le thème et connectez votre premier fournisseur IA. Les clés restent toujours locales.',
    steps: {
      language: 'Langue',
      theme: 'Thème',
      provider: 'Fournisseur IA',
    },
    language: {
      title: 'Choisissez votre langue',
      description: 'Vous pourrez la modifier plus tard dans les paramètres.',
    },
    theme: {
      title: 'Sélectionnez un thème',
      description: 'Choisissez l’apparence par défaut. Vous pourrez changer ensuite.',
    },
    provider: {
      title: 'Connectez un fournisseur IA',
      description: 'Ajoutez au moins une clé API pour commencer à discuter.',
    },
    buttons: {
      next: 'Suivant',
      back: 'Retour',
      skip: 'Passer pour le moment',
    },
  },
} as const satisfies TranslationDictionary

