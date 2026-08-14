import React, { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import DataSection from './components/DataSection.jsx'
import AnalysisSection from './components/AnalysisSection.jsx'
import ScenariosSection from './components/ScenariosSection.jsx'
import ModelSection from './components/ModelSection.jsx'
import { computePeriodPnL } from './lib/calculations.js'
import { buildSampleState } from './lib/sampleData.js'
import { Menu, X } from 'lucide-react'

export default function App() {
  const [periods, setPeriods] = useState(['Период 1', 'Период 2', 'Период 3'])
  const [pnl, setPnl] = useState({
    revenue: [0, 0, 0],
    cogs: [0, 0, 0],
    opex: [0, 0, 0],
    otherIncome: [0, 0, 0],
    otherExpense: [0, 0, 0],
    interest: [0, 0, 0],
  })
  const [balance, setBalance] = useState({
    currentAssets: ['', '', ''],
    currentLiabilities: ['', '', ''],
    totalAssets: ['', '', ''],
    debt: ['', '', ''],
    equity: ['', '', ''],
  })
  const [taxRatePct, setTaxRatePct] = useState(20)

  const [scenarios, setScenarios] = useState({
    pessimistic: { revenueGrowth: -5, cogsShare: 65, opexShare: 20 },
    base: { revenueGrowth: 5, cogsShare: 60, opexShare: 15 },
    optimistic: { revenueGrowth: 15, cogsShare: 55, opexShare: 12 },
  })
  const [horizon, setHorizon] = useState(6)

  const [dcf, setDcf] = useState({
    initialInvestment: 0,
    wacc: 15,
    terminalGrowth: 2,
    cashFlows: [0, 0, 0, 0, 0],
  })
  const [breakeven, setBreakeven] = useState({
    fixedCosts: 0,
    price: 0,
    variableCostPerUnit: 0,
  })

  const [activeSection, setActiveSection] = useState('data')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const pnlComputed = useMemo(
    () =>
      periods.map((_, idx) =>
        computePeriodPnL(
          {
            revenue: pnl.revenue[idx],
            cogs: pnl.cogs[idx],
            opex: pnl.opex[idx],
            otherIncome: pnl.otherIncome[idx],
            otherExpense: pnl.otherExpense[idx],
            interest: pnl.interest[idx],
          },
          taxRatePct
        )
      ),
    [periods, pnl, taxRatePct]
  )

  function addPeriod(name) {
    setPeriods((p) => [...p, name || `Период ${p.length + 1}`])
    setPnl((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => (next[k] = [...next[k], 0]))
      return next
    })
    setBalance((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => (next[k] = [...next[k], '']))
      return next
    })
  }

  function removePeriod(idx) {
    setPeriods((p) => p.filter((_, i) => i !== idx))
    setPnl((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => (next[k] = next[k].filter((_, i) => i !== idx)))
      return next
    })
    setBalance((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => (next[k] = next[k].filter((_, i) => i !== idx)))
      return next
    })
  }

  function renamePeriod(idx, name) {
    setPeriods((p) => p.map((v, i) => (i === idx ? name : v)))
  }

  function updatePnlCell(field, idx, value) {
    setPnl((prev) => {
      const next = { ...prev, [field]: [...prev[field]] }
      next[field][idx] = value
      return next
    })
  }

  function updateBalanceCell(field, idx, value) {
    setBalance((prev) => {
      const next = { ...prev, [field]: [...prev[field]] }
      next[field][idx] = value
      return next
    })
  }

  /** Слияние импортированных данных: новые периоды дописываются в конец. */
  function mergeImportedData(newPeriods, newPnlByField, newBalanceByField) {
    setPeriods((p) => [...p, ...newPeriods])
    setPnl((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        const addition = newPnlByField[k] || newPeriods.map(() => 0)
        next[k] = [...next[k], ...addition]
      })
      return next
    })
    setBalance((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        const addition = newBalanceByField[k] || newPeriods.map(() => '')
        next[k] = [...next[k], ...addition]
      })
      return next
    })
  }

  function loadSample() {
    const sample = buildSampleState()
    setPeriods(sample.periods)
    setPnl(sample.pnl)
    setBalance(sample.balance)
    setTaxRatePct(sample.taxRatePct)
    setBreakeven(sample.breakeven)
    setDcf((prev) => ({ ...prev }))
    setActiveSection('data')
  }

  function resetAll() {
    setPeriods(['Период 1'])
    setPnl({
      revenue: [0],
      cogs: [0],
      opex: [0],
      otherIncome: [0],
      otherExpense: [0],
      interest: [0],
    })
    setBalance({
      currentAssets: [''],
      currentLiabilities: [''],
      totalAssets: [''],
      debt: [''],
      equity: [''],
    })
  }

  const sections = {
    data: (
      <DataSection
        periods={periods}
        pnl={pnl}
        balance={balance}
        taxRatePct={taxRatePct}
        onAddPeriod={addPeriod}
        onRemovePeriod={removePeriod}
        onRenamePeriod={renamePeriod}
        onUpdatePnlCell={updatePnlCell}
        onUpdateBalanceCell={updateBalanceCell}
        onSetTaxRate={setTaxRatePct}
        onMergeImported={mergeImportedData}
        onLoadSample={loadSample}
        onResetAll={resetAll}
      />
    ),
    analysis: (
      <AnalysisSection periods={periods} pnlComputed={pnlComputed} balance={balance} />
    ),
    scenarios: (
      <ScenariosSection
        periods={periods}
        pnlComputed={pnlComputed}
        scenarios={scenarios}
        setScenarios={setScenarios}
        horizon={horizon}
        setHorizon={setHorizon}
        taxRatePct={taxRatePct}
      />
    ),
    model: (
      <ModelSection
        dcf={dcf}
        setDcf={setDcf}
        breakeven={breakeven}
        setBreakeven={setBreakeven}
        scenarios={scenarios}
        pnlComputed={pnlComputed}
        horizon={horizon}
        taxRatePct={taxRatePct}
      />
    ),
  }

  return (
    <div className="min-h-screen flex bg-surface text-slate-100">
      {/* Мобильная верхняя панель */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-panel border-b border-border">
        <span className="font-semibold">Financial Desk</span>
        <button className="btn-secondary" onClick={() => setMobileNavOpen((v) => !v)}>
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <Sidebar
        active={activeSection}
        onSelect={(id) => {
          setActiveSection(id)
          setMobileNavOpen(false)
        }}
        mobileOpen={mobileNavOpen}
      />

      <main className="flex-1 min-w-0 pt-14 md:pt-0 md:ml-64 p-4 md:p-8 max-w-[1400px]">
        {sections[activeSection]}
      </main>
    </div>
  )
}
