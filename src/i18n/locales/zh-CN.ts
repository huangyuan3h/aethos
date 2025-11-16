import type { TranslationDictionary } from '../types'

export const zhCN = {
  app: {
    hero: {
      kicker: 'Aethos / 个性化智能工作台',
      headlineReady: '工作区已就绪',
      headlineConnect: '连接一个 AI 提供商',
      descriptionReady: '当前默认提供商：{{provider}}。',
      descriptionConnect: '添加自己的 API Key，立即开始对话与工作流。',
      button: '管理提供商',
      cardTitle: '马上就好',
      cardBody:
        '至少添加一个 API Key（OpenAI、OpenRouter、Anthropic、Gemini），即可聊天并调用 MCP 工具。',
      cardCTA: '去配置提供商',
    },
  },
  settings: {
    header: {
      kicker: '设置',
      sectionTitle: {
        general: '通用偏好',
        theme: '主题',
        providers: 'AI 提供商',
        mcp: '模型上下文协议',
      },
      sectionDescription: {
        general: '语言、提示词和默认行为。',
        theme: '控制配色和排版。',
        providers: '管理你的 API Key，所有数据仅保存在本地。',
        mcp: '配置 MCP 数据源和已安装的服务。',
      },
    },
    nav: {
      general: { label: '通用', description: '语言与提示词' },
      theme: { label: '主题', description: '外观' },
      providers: { label: '提供商', description: 'AI 凭据' },
      mcp: { label: 'MCP', description: '上下文服务器' },
    },
    general: {
      language: {
        title: '语言',
        description: '选择界面显示语言。',
        placeholder: '请选择语言',
      },
      systemPrompt: {
        title: '系统提示词',
        description: '自定义每次对话的开场提示词，留空则使用默认设置。',
        placeholder: '例如：你是 Aethos，一名双语 AI 工作助手……',
      },
      saveButton: '保存更改',
    },
    theme: {
      description: '统一管理整个工作区的外观与字体。',
      presets: {
        title: '预设主题',
        description: '在适合明暗环境的精选配色之间切换。',
      },
      custom: {
        title: '自定义颜色',
        description: '覆盖任意色板，精细调整背景、文字与操作按钮。',
        reset: '恢复预设',
      },
      saveButton: '保存主题',
    },
    providers: {
      addTitle: '新增提供商',
      addDescription: '加密保存 OpenAI、OpenRouter、Anthropic 等兼容的 Key。',
      listTitle: '已连接的提供商',
      listDescription: '选择默认模型或移除不再需要的提供商。',
    },
    mcp: {
      headerTitle: 'MCP 市场',
      headerDescription: '管理 MCP 数据源、注册表条目与安装的服务器。',
      refresh: '刷新数据',
      sources: {
        title: '数据源',
        description: '新增或删除市场端点。',
        empty: '暂未配置任何数据源。',
        saveButton: '保存数据源',
      },
      installed: {
        title: '已安装服务器',
        description: '登记本地 MCP 服务并管理运行状态。',
        empty: '尚未安装任何服务器。',
        registerButton: '登记服务器',
        start: '启动',
        stop: '停止',
      },
      registry: {
        title: '注册表',
        description: '来自各个数据源的条目。',
        empty: '注册表为空。新增数据源并刷新即可获取条目。',
      },
    },
  },
  providerForm: {
    placeholders: {
      provider: '选择提供商',
      displayName: 'OpenAI',
      apiKey: 'sk-...',
      model: 'gpt-4o-mini',
    },
    labels: {
      provider: '提供商',
      displayName: '显示名称',
      apiKey: 'API Key',
      model: '首选模型',
    },
    makeDefault: '设为默认提供商',
    actions: {
      save: '保存提供商',
    },
    errors: {
      shortKey: 'API Key 似乎过短。',
    },
  },
  providerList: {
    empty: '尚未配置任何提供商，添加一个 Key 即可开始。',
    defaultBadge: '默认',
    noModel: '未设置首选模型',
    setDefault: '设为默认',
  },
  mcp: {
    sources: {
      endpoint: 'https://example.com/manifest.json',
    },
    servers: {
      slugPlaceholder: 'filesystem-tools',
      namePlaceholder: '文件系统工具',
      versionPlaceholder: '1.0.0',
    },
  },
  common: {
    actions: {
      saving: '保存中…',
      close: '关闭',
    },
  },
  onboarding: {
    kicker: '欢迎',
    title: '个性化你的 Aethos',
    description: '选择语言、主题并连接第一个 AI 提供商。所有 Key 仅保存在本地。',
    steps: {
      language: '语言',
      theme: '主题',
      provider: 'AI 提供商',
    },
    language: {
      title: '选择界面语言',
      description: '稍后也可在设置中修改。',
    },
    theme: {
      title: '选择默认主题',
      description: '可随时切换喜好的外观风格。',
    },
    provider: {
      title: '连接 AI 提供商',
      description: '添加至少一个 API Key 即可开始聊天。',
    },
    buttons: {
      next: '下一步',
      back: '返回',
      skip: '暂时跳过',
    },
  },
} as const satisfies TranslationDictionary
