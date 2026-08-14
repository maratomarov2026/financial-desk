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
} from 'recharts'
import { forecastScenario, formatMoney, formatNumber } from '../lib/calculations.js'

const SCENARIO_META = {
  pessimistic: { label: 'Пессимистичный', color: '#ef4444' },
  base: { label: 'Базовый', color: '#4f8cff' },
  optimistic: { label: 'Оптимистичный', color: '#22c55e' },
}

export default function ScenariosSection({
  periods,
  pnlComputed,
  scenarios,
  setScenarios,
  horizon,
  setHorizon,
  taxRatePct,
}) {
  const lastRevenue = pnlComputed[pnlComputed.length - 1]?.revenue ?? 0

  const forecasts = useMemo(() => {
    const out = {}
    Object.keys(scenarios).forEach((key) => {
      out[key] = forecastScenario(lastRevenue, scenarios[key], horizon, taxRatePct)
    })
    return out
  }, [scenarios, lastRevenue, horizon, taxRatePct])

  const chartData = useMemo(() => {
    return Array.from({ length: horizon }).map((_, i) => {
      const row = { period: `+${i + 1}` }
      Object.keys(scenarios).forEach((key) => {
        row[SCENARIO_META[key].label] = forecasts[key][i]?.revenue ?? 0
      })
      return row
    })
  }, [forecasts, scenarios, horizon])

  function updateScenarioField(key, field, value) {
    setScenarios((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(value) },
    }))
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Сценарии</h1>
          <p className="text-sm text-slate-400">
            Сравнение вариантов решений: пессимистичный / базовый / оптимистичный. Точка отсчёта — выручка
            последнего фактического периода ({formatMoney(lastRevenue)}).
          </p>
        </div>
        <div>
          <span className="label">Горизонт прогноза (периодов)</span>
          <input
            type="number"
            min={1}
            max={10}
            className="input w-32"
            value={horizon}
            onChange={(e) => setHorizon(Math.min(10, Math.max(1, Number(e.target.value))))}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.entries(scenarios).map(([key, s]) => (
          <div className="card space-y-3" key={key}>
            <h3 className="font-medium" style={{ color: SCENARIO_META[key].color }}>
              {SCENARIO_META[key].label}
            </h3>
            <div>
              <span className="label">Рост выручки, % за период</span>
              <input
                type="number"
                className="input"
                value={s.revenueGrowth}
                onChange={(e) => updateScenarioField(key, 'revenueGrowth', e.target.value)}
              />
            </div>
            <div>
              <span className="label">Доля себестоимости от выручки, %</span>
              <input
                type="number"
                className="input"
                value={s.cogsShare}
                onChange={(e) => updateScenarioField(key, 'cogsShare', e.target.value)}
              />
            </div>
            <div>
              <span className="label">Доля опекс от выручки, %</span>
              <input
                type="number"
                className="input"
                value={s.opexShare}
                onChange={(e) => updateScenarioField(key, 'opexShare', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-medium mb-3">Сравнение сценариев по выручке</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
              <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, 0)} />
              <Tooltip
                contentStyle={{ background: '#161a23', border: '1px solid #232836', borderRadius: 8 }}
                formatter={(v) => formatMoney(v)}
              />
              <Legend />
              {Object.entries(SCENARIO_META).map(([key, meta]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={meta.label}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.entries(scenarios).map(([key]) => (
          <div className="card" key={key}>
            <h3 className="font-medium mb-2" style={{ color: SCENARIO_META[key].color }}>
              {SCENARIO_META[key].label} — построчный прогноз
            </h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Период</th>
                    <th>Выручка</th>
                    <th>Чист. прибыль</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts[key].map((row) => (
                    <tr key={row.period}>
                      <td>+{row.period}</td>
                      <td>{formatMoney(row.revenue)}</td>
                      <td>{formatMoney(row.netProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
