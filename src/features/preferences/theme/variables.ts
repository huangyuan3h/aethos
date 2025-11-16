import type { ThemeVariableDefinition } from './types'

export const THEME_VARIABLES: ThemeVariableDefinition[] = [
  {
    id: 'background',
    label: 'Background',
    description: 'Primary app background color.',
    group: 'surfaces',
  },
  {
    id: 'card',
    label: 'Card surface',
    description: 'Panels, modals and cards.',
    group: 'surfaces',
  },
  {
    id: 'border',
    label: 'Border',
    description: 'Outlines for cards, inputs and dividers.',
    group: 'surfaces',
  },
  {
    id: 'input',
    label: 'Input background',
    description: 'Text fields and textareas.',
    group: 'surfaces',
  },
  {
    id: 'popover',
    label: 'Popover surface',
    description: 'Menus, dropdowns and popovers.',
    group: 'surfaces',
  },
  {
    id: 'foreground',
    label: 'Foreground text',
    description: 'Primary text color.',
    group: 'content',
  },
  {
    id: 'card-foreground',
    label: 'Card text',
    description: 'Text shown on panels.',
    group: 'content',
  },
  {
    id: 'muted',
    label: 'Muted background',
    description: 'Subtle backgrounds for chips and tags.',
    group: 'content',
  },
  {
    id: 'muted-foreground',
    label: 'Muted text',
    description: 'Secondary text color.',
    group: 'content',
  },
  {
    id: 'popover-foreground',
    label: 'Popover text',
    description: 'Text inside menus and dropdowns.',
    group: 'content',
  },
  {
    id: 'primary',
    label: 'Primary',
    description: 'Primary buttons and highlights.',
    group: 'accents',
  },
  {
    id: 'primary-foreground',
    label: 'Primary text',
    description: 'Text on primary buttons.',
    group: 'accents',
  },
  {
    id: 'secondary',
    label: 'Secondary',
    description: 'Secondary buttons and chips.',
    group: 'accents',
  },
  {
    id: 'secondary-foreground',
    label: 'Secondary text',
    description: 'Text on secondary actions.',
    group: 'accents',
  },
  {
    id: 'accent',
    label: 'Accent',
    description: 'Special emphasis states.',
    group: 'accents',
  },
  {
    id: 'accent-foreground',
    label: 'Accent text',
    description: 'Text on accent surfaces.',
    group: 'accents',
  },
  {
    id: 'ring',
    label: 'Focus ring',
    description: 'Outline for focused inputs.',
    group: 'accents',
  },
  {
    id: 'destructive',
    label: 'Destructive',
    description: 'Danger buttons and warnings.',
    group: 'feedback',
  },
  {
    id: 'destructive-foreground',
    label: 'Destructive text',
    description: 'Text on danger backgrounds.',
    group: 'feedback',
  },
]

