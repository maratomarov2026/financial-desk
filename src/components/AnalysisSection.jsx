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
import { TrendingUp, Percent, Wallet, BarChart3 } from 'lucide-react'
import { computeRatios, formatMoney, formatPercent, formatNumber } from '../lib/calculations.js'

function KpiCard({ icon: Icon, label, value, tone = 'default' }) {
  const toneClass =
    tone === 'up' ? 'text-accent2' : tone === 'down' ? 'text-danger' : 'text-slate-100'
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className={`text-lg font-semibold ${toneClass}`}>{value}</div>
      </div>
    </div>
  )
}

export default function AnalysisSection({ periods, pnlComputed, balance }) {
  const last = pnlComputed[pnlComputed.length - 1]
  const prev = pnlComputed[pnlComputed.length - 2]

  const revenueGrowth =
    prev && prev.revenue ? (last.revenue - prev.revenue) / prev.revenue : null

  const chartData = useMemo(
    () =>
      periods.map((p, idx) => ({
        period: p,
        Выручка: pnlComputed[idx]?.revenue ?? 0,
        'Чистая прибыль': pnlComputed[idx]?.netProfit ?? 0,
        'Валовая маржа': pnlComputed[idx]?.grossMargin != null ? pnlComputed[idx].grossMargin * 100 : null,
        'EBIT-маржа': pnlComputed[idx]?.ebitMargin != null ? pnlComputed[idx].ebitMargin * 100 : null,
        'Чистая маржа': pnlComputed[idx]?.netMargin != null ? pnlComputed[idx].netMargin * 100 : null,
      })),
    [periods, pnlComputed]
  )

  const ratiosByPeriod = useMemo(
    () =>
      periods.map((_, idx) =>
        computeRatios(pnlComputed[idx], {
          currentAssets: balance.currentAssets[idx],
          currentLiabilities: balance.currentLiabilities[idx],
          totalAssets: balance.totalAssets[idx],
          debt: balance.debt[idx],
          equity: balance.equity[idx],
        })
      ),
    [periods, pnlComputed, balance]
  )

  const hasAnyRatios = ratiosByPeriod.some(Boolean)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Анализ</h1>
        <p className="text-sm text-slate-400">Маржинальность, динамика и коэффициенты по данным раздела «Данные».</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} label="Валовая маржа" value={formatPercent(last?.grossMargin)} />
        <KpiCard icon={Percent} label="EBIT-маржа" value={formatPercent(last?.ebitMargin)} />
        <KpiCard icon={BarChart3} label="Чистая маржа" value={formatPercent(last?.netMargin)} />
        <KpiCard
          icon={TrendingUp}
          label="Рост выручки к пред. периоду"
          value={revenueGrowth == null ? '—' : formatPercent(revenueGrowth)}
          tone={revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'default'}
        />
      </div>

      <div className="card">
        <h3 className="font-medium mb-3">Динамика выручки и чистой прибыли</h3>
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
              <Line type="monotone" dataKey="Выручка" stroke="#4f8cff" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Чистая прибыль" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3">Динамика маржинальности</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232836" />
              <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#161a23', border: '1px solid #232836', borderRadius: 8 }}
                formatter={(v) => `${formatNumber(v)}%`}
              />
              <Legend />
              <Line type="monotone" dataKey="Валовая маржа" stroke="#4f8cff" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="EBIT-маржа" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Чистая маржа" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-3">Коэффициенты</h3>
        {!hasAnyRatios ? (
          <p className="text-sm text-slate-400">
            Заполните раздел «Баланс» на странице «Данные», чтобы увидеть коэффициенты ликвидности и
            рентабельности.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Коэффициент</th>
                  {periods.map((p, idx) => (
                    <th key={idx}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-slate-300">Текущая ликвидность</td>
                  {ratiosByPeriod.map((r, idx) => (
                    <td key={idx}>{r?.currentRatio != null ? formatNumber(r.currentRatio) : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-slate-300">ROE</td>
                  {ratiosByPeriod.map((r, idx) => (
                    <td key={idx}>{r?.roe != null ? formatPercent(r.roe) : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-slate-300">ROA</td>
                  {ratiosByPeriod.map((r, idx) => (
                    <td key={idx}>{r?.roa != null ? formatPercent(r.roa) : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-slate-300">Долг / Капитал</td>
                  {ratiosByPeriod.map((r, idx) => (
                    <td key={idx}>{r?.debtToEquity != null ? formatNumber(r.debtToEquity) : '—'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
