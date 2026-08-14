import React, { useState } from 'react'
import { Plus, Trash2, Sparkles, RotateCcw } from 'lucide-react'
import ImportPanel from './ImportPanel.jsx'

const PNL_ROWS = [
  { key: 'revenue', label: 'Выручка' },
  { key: 'cogs', label: 'Себестоимость' },
  { key: 'opex', label: 'Опекс' },
  { key: 'otherIncome', label: 'Прочие доходы' },
  { key: 'otherExpense', label: 'Прочие расходы' },
  { key: 'interest', label: 'Проценты к уплате' },
]

const BALANCE_ROWS = [
  { key: 'currentAssets', label: 'Оборотные активы' },
  { key: 'currentLiabilities', label: 'Краткосрочные обязательства' },
  { key: 'totalAssets', label: 'Активы всего' },
  { key: 'debt', label: 'Долг' },
  { key: 'equity', label: 'Капитал' },
]

export default function DataSection({
  periods,
  pnl,
  balance,
  taxRatePct,
  onAddPeriod,
  onRemovePeriod,
  onRenamePeriod,
  onUpdatePnlCell,
  onUpdateBalanceCell,
  onSetTaxRate,
  onMergeImported,
  onLoadSample,
  onResetAll,
}) {
  const [newPeriodName, setNewPeriodName] = useState('')

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Данные</h1>
          <p className="text-sm text-slate-400">Свод данных из первоисточников или ручной ввод по периодам.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onLoadSample}>
            <Sparkles size={16} />
            Загрузить пример
          </button>
          <button className="btn-secondary" onClick={onResetAll}>
            <RotateCcw size={16} />
            Сбросить
          </button>
        </div>
      </header>

      <ImportPanel onMerge={onMergeImported} />

      <div className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-medium">Ручной ввод — P&amp;L</h3>
          <div className="flex items-end gap-2">
            <div>
              <span className="label">Ставка налога на прибыль, %</span>
              <input
                type="number"
                className="input w-32"
                value={taxRatePct}
                onChange={(e) => onSetTaxRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Статья</th>
                {periods.map((p, idx) => (
                  <th key={idx}>
                    <div className="flex items-center gap-1">
                      <input
                        className="input min-w-[110px]"
                        value={p}
                        onChange={(e) => onRenamePeriod(idx, e.target.value)}
                      />
                      <button
                        className="btn-danger !px-1.5"
                        title="Удалить период"
                        onClick={() => onRemovePeriod(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PNL_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="text-slate-300 whitespace-nowrap">{row.label}</td>
                  {periods.map((_, idx) => (
                    <td key={idx}>
                      <input
                        type="number"
                        className="input min-w-[110px]"
                        value={pnl[row.key][idx] ?? 0}
                        onChange={(e) => onUpdatePnlCell(row.key, idx, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="input max-w-xs"
            placeholder="Название нового периода"
            value={newPeriodName}
            onChange={(e) => setNewPeriodName(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => {
              onAddPeriod(newPeriodName)
              setNewPeriodName('')
            }}
          >
            <Plus size={16} />
            Добавить период
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-medium">Ручной ввод — Баланс (для коэффициентов)</h3>
        <p className="text-sm text-slate-400">
          Необязательный раздел: коэффициенты ликвидности и рентабельности рассчитываются только если баланс
          заполнен.
        </p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Статья</th>
                {periods.map((p, idx) => (
                  <th key={idx}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BALANCE_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="text-slate-300 whitespace-nowrap">{row.label}</td>
                  {periods.map((_, idx) => (
                    <td key={idx}>
                      <input
                        type="number"
                        className="input min-w-[110px]"
                        value={balance[row.key][idx] ?? ''}
                        onChange={(e) => onUpdateBalanceCell(row.key, idx, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
