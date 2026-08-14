import React from 'react'
import { Database, LineChart, GitCompareArrows, Calculator, Wallet } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'data', label: 'Данные', icon: Database, hint: 'Свод и ввод' },
  { id: 'analysis', label: 'Анализ', icon: LineChart, hint: 'KPI и коэффициенты' },
  { id: 'scenarios', label: 'Сценарии', icon: GitCompareArrows, hint: 'Варианты решений' },
  { id: 'model', label: 'Модель', icon: Calculator, hint: 'DCF и точка безубыточности' },
]

export default function Sidebar({ active, onSelect, mobileOpen }) {
  return (
    <aside
      className={`fixed z-20 top-14 md:top-0 left-0 h-[calc(100%-3.5rem)] md:h-full w-64 bg-panel border-r border-border
      transform transition-transform duration-200 md:translate-x-0
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="hidden md:flex items-center gap-2 px-5 h-16 border-b border-border">
        <Wallet size={20} className="text-accent" />
        <div>
          <div className="font-semibold leading-tight">Financial Desk</div>
          <div className="text-xs text-slate-500 leading-tight">Финансовый ассистент</div>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
              ${active === id ? 'bg-accent/15 text-accent' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <Icon size={18} />
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-slate-500">{hint}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-slate-600 border-t border-border">
        Данные хранятся только в памяти браузера на время сессии.
      </div>
    </aside>
  )
}
