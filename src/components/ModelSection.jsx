import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from 'recharts'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import {
  computeNPV,
  computeIRR,
  computePaybackPeriod,
  breakEvenUnits,
  breakEvenRevenue,
  contributionMargin,
  contributionMarginRatio,
  formatMoney,
  formatPercent,
  formatNumber,
} from '../lib/calculations.js'

function DcfCalculator({ dcf, setDcf, scenarios, taxRatePct }) {
  const npv = useMemo(
    () => computeNPV(dcf.initialInvestment, dcf.cashFlows, dcf.wacc, dcf.terminalGrowth),
    [dcf]
  )
  const irr = useMemo(
    () => computeIRR(dcf.initialInvestment, dcf.cashFlows, dcf.terminalGrowth),
    [dcf]
  )
  const payback = useMemo(
    () => computePaybackPeriod(dcf.initialInvestment, dcf.cashFlows),
    [dcf]
  )

  function updateCashFlow(idx, value) {
    setDcf((prev) => {
      const next = [...prev.cashFlows]
      next[idx] = Number(value)
      return { ...prev, cashFlows: next }
    })
  }

  function addYear() {
    setDcf((prev) => ({ ...prev, cashFlows: [...prev.cashFlows, 0] }))
  }

  function removeYear(idx) {
    setDcf((prev) => ({ ...prev, cashFlows: prev.cashFlows.filter((_, i) => i !== idx) }))
  }

  function fillFromBaseScenario() {
    // Использует прогноз базового сценария (см. раздел «Сценарии») как денежные потоки.
    const base = scenarios.base
    setDcf((prev) => {
      const n = prev.cashFlows.length || 5
      const flows = []
      let rev = prev.cashFlows.length ? Math.abs(prev.cashFlows[0]) || 1000000 : 1000000
      for (let i = 0; i < n; i++) {
        rev = rev * (1 + (base.revenueGrowth || 0) / 100)
        const cogs = rev * ((base.cogsShare || 0) / 100)
        const opex = rev * ((base.opexShare || 0) / 100)
        const pretax = rev - cogs - opex
        const taxAmt = pretax > 0 ? pretax * ((taxRatePct || 0) / 100) : 0
        flows.push(Math.round(pretax - taxAmt))
      }
      return { ...prev, cashFlows: flows }
    })
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-medium">DCF-калькулятор</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="label">Начальные инвестиции</span>
          <input
            type="number"
            className="input"
            value={dcf.initialInvestment}
            onChange={(e) => setDcf((p) => ({ ...p, initialInvestment: Number(e.target.value) }))}
          />
        </div>
        <div>
          <span className="label">Ставка дисконтирования (WACC), %</span>
          <input
            type="number"
            className="input"
            value={dcf.wacc}
            onChange={(e) => setDcf((p) => ({ ...p, wacc: Number(e.target.value) }))}
          />
        </div>
        <div>
          <span className="label">Темп роста в постпрогнозном периоде, %</span>
          <input
            type="number"
            className="input"
            value={dcf.terminalGrowth}
            onChange={(e) => setDcf((p) => ({ ...p, terminalGrowth: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label mb-0">Денежные потоки по годам</span>
          <button className="btn-secondary" onClick={fillFromBaseScenario}>
            <Wand2 size={14} />
            Из базового сценария
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {dcf.cashFlows.map((cf, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="text-xs text-slate-500 w-10">Год {idx + 1}</span>
              <input
                type="number"
                className="input w-36"
                value={cf}
                onChange={(e) => updateCashFlow(idx, e.target.value)}
              />
              <button className="btn-danger !px-1.5" onClick={() => removeYear(idx)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className="btn-secondary" onClick={addYear}>
            <Plus size={14} />
            Год
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">NPV</div>
          <div className={`text-lg font-semibold ${npv >= 0 ? 'text-accent2' : 'text-danger'}`}>
            {formatMoney(npv)}
          </div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">IRR</div>
          <div className="text-lg font-semibold">{irr == null ? 'не найден' : `${formatNumber(irr)}%`}</div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">Срок окупаемости</div>
          <div className="text-lg font-semibold">
            {payback == null ? 'не окупается' : `${formatNumber(payback)} лет`}
          </div>
        </div>
      </div>
    </div>
  )
}

function BreakEvenCalculator({ breakeven, setBreakeven }) {
  const { fixedCosts, price, variableCostPerUnit } = breakeven

  const units = useMemo(
    () => breakEvenUnits(fixedCosts, price, variableCostPerUnit),
    [fixedCosts, price, variableCostPerUnit]
  )
  const revenueAtBE = useMemo(
    () => breakEvenRevenue(fixedCosts, price, variableCostPerUnit),
    [fixedCosts, price, variableCostPerUnit]
  )
  const cm = contributionMargin(price, variableCostPerUnit)
  const cmRatio = contributionMarginRatio(price, variableCostPerUnit)

  const chartData = useMemo(() => {
    const maxUnits = units ? Math.ceil(units * 2.5) + 5 : 20
    const step = Math.max(1, Math.round(maxUnits / 20))
    const points = []
    for (let u = 0; u <= maxUnits; u += step) {
      points.push({
        units: u,
        Выручка: u * price,
        'Совокупные затраты': fixedCosts + u * variableCostPerUnit,
      })
    }
    return points
  }, [units, price, fixedCosts, variableCostPerUnit])

  return (
    <div className="card space-y-4">
      <h3 className="font-medium">Точка безубыточности</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="label">Постоянные затраты</span>
          <input
            type="number"
            className="input"
            value={fixedCosts}
            onChange={(e) => setBreakeven((p) => ({ ...p, fixedCosts: Number(e.target.value) }))}
          />
        </div>
        <div>
          <span className="label">Цена за единицу</span>
          <input
            type="number"
            className="input"
            value={price}
            onChange={(e) => setBreakeven((p) => ({ ...p, price: Number(e.target.value) }))}
          />
        </div>
        <div>
          <span className="label">Переменные затраты на единицу</span>
          <input
            type="number"
            className="input"
            value={variableCostPerUnit}
            onChange={(e) => setBreakeven((p) => ({ ...p, variableCostPerUnit: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">Точка безуб., ед.</div>
          <div className="text-lg font-semibold">{units == null ? '—' : formatNumber(units)}</div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">Точка безуб., ₸</div>
          <div className="text-lg font-semibold">{revenueAtBE == null ? '—' : formatMoney(revenueAtBE)}</div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">Маржин. прибыль/ед.</div>
          <div className="text-lg font-semibold">{formatMoney(cm)}</div>
        </div>
        <div className="rounded-lg bg-surface border border-border p-3">
          <div className="text-xs text-slate-400">Маржа по вкладу</div>
          <div className="text-lg font-semibold">{cmRatio == null ? '—' : formatPercent(cmRatio)}</div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
            <XAxis dataKey="units" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, 0)} />
            <Tooltip
              contentStyle={{ background: '#161a23', border: '1px solid #232836', borderRadius: 8 }}
              formatter={(v) => formatMoney(v)}
            />
            <Legend />
            <Line type="monotone" dataKey="Выручка" stroke="#4f8cff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Совокупные затраты" stroke="#f59e0b" strokeWidth={2} dot={false} />
            {units != null && (
              <ReferenceDot x={Math.round(units)} y={units * price} r={5} fill="#22c55e" stroke="none" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function ModelSection({ dcf, setDcf, breakeven, setBreakeven, scenarios, taxRatePct }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Модель</h1>
        <p className="text-sm text-slate-400">
          Финансовая модель: обоснование инвестиционного решения (DCF) и точка безубыточности продукта/услуги.
        </p>
      </header>

      <DcfCalculator dcf={dcf} setDcf={setDcf} scenarios={scenarios} taxRatePct={taxRatePct} />
      <BreakEvenCalculator breakeven={breakeven} setBreakeven={setBreakeven} />
    </div>
  )
}
