import React from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'cards' | 'table'

interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  storageKey?: string
}

export function ViewModeToggle({ mode, onChange, storageKey }: ViewModeToggleProps) {
  const handleSelect = (newMode: ViewMode) => {
    onChange(newMode)
    if (storageKey) {
      try {
        localStorage.setItem(`fl_view_${storageKey}`, newMode)
      } catch (_) {
        // ignore localstorage errors
      }
    }
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleSelect('cards')}
        className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
          mode === 'cards'
            ? 'bg-white text-slate-900 shadow-xs font-semibold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Visualização em Cartões"
      >
        <LayoutGrid className="w-3.5 h-3.5 mr-1" />
        Cartões
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleSelect('table')}
        className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
          mode === 'table'
            ? 'bg-white text-slate-900 shadow-xs font-semibold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Visualização em Tabela"
      >
        <List className="w-3.5 h-3.5 mr-1" />
        Tabela
      </Button>
    </div>
  )
}

export function getStoredViewMode(storageKey: string, defaultMode: ViewMode = 'cards'): ViewMode {
  try {
    const stored = localStorage.getItem(`fl_view_${storageKey}`)
    if (stored === 'cards' || stored === 'table') {
      return stored
    }
  } catch (_) {
    // fallback
  }
  return defaultMode
}
