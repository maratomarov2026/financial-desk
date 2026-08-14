// Финансовые формулы — см. PRD, раздел 6 «Формулы и логика расчётов».

/** Валовая прибыль = Выручка − Себестоимость */
export function grossProfit(revenue, cogs) {
  return (revenue || 0) - (cogs || 0)
}

/** EBIT = Валовая прибыль − Опекс + Прочие доходы − Прочие расходы */
export function ebit(revenue, cogs, opex, otherIncome, otherExpense) {
  return grossProfit(revenue, cogs) - (opex || 0) + (otherIncome || 0) - (otherExpense || 0)
}

/** Прибыль до налога = EBIT − Проценты к уплате */
export function pretaxProfit(revenue, cogs, opex, otherIncome, otherExpense, interest) {
  return ebit(revenue, cogs, opex, otherIncome, otherExpense) - (interest || 0)
}

/** Налог = Прибыль до налога × Ставка налога (если прибыль > 0, иначе 0) */
export function tax(pretax, taxRatePct) {
  if (pretax <= 0) return 0
  return pretax * ((taxRatePct || 0) / 100)
}

/** Чистая прибыль = Прибыль до налога − Налог */
export function netProfit(pretax, taxAmount) {
  return pretax - taxAmount
}

/** Полный расчёт P&L-показателей за один период. */
export function computePeriodPnL(row, taxRatePct) {
  const revenue = num(row.revenue)
  const cogs = num(row.cogs)
  const opex = num(row.opex)
  const otherIncome = num(row.otherIncome)
  const otherExpense = num(row.otherExpense)
  const interest = num(row.interest)

  const gp = grossProfit(revenue, cogs)
  const eb = ebit(revenue, cogs, opex, otherIncome, otherExpense)
  const pre = pretaxProfit(revenue, cogs, opex, otherIncome, otherExpense, interest)
  const taxAmt = tax(pre, taxRatePct)
  const net = netProfit(pre, taxAmt)

  return {
    revenue,
    cogs,
    opex,
    otherIncome,
    otherExpense,
    interest,
    grossProfit: gp,
    ebit: eb,
    pretaxProfit: pre,
    tax: taxAmt,
    netProfit: net,
    grossMargin: revenue ? gp / revenue : null,
    ebitMargin: revenue ? eb / revenue : null,
    netMargin: revenue ? net / revenue : null,
  }
}

/** Коэффициенты, требующие данных баланса. */
export function computeRatios(pnlRow, balanceRow) {
  const currentAssets = num(balanceRow?.currentAssets)
  const currentLiabilities = num(balanceRow?.currentLiabilities)
  const totalAssets = num(balanceRow?.totalAssets)
  const debt = num(balanceRow?.debt)
  const equity = num(balanceRow?.equity)

  const hasBalance =
    currentAssets || currentLiabilities || totalAssets || debt || equity

  if (!hasBalance) return null

  return {
    currentRatio: currentLiabilities ? currentAssets / currentLiabilities : null,
    roe: equity ? pnlRow.netProfit / equity : null,
    roa: totalAssets ? pnlRow.netProfit / totalAssets : null,
    debtToEquity: equity ? debt / equity : null,
  }
}

/** Точка безубыточности, ед. = Постоянные затраты / (Цена − Переменные затраты на ед.) */
export function breakEvenUnits(fixedCosts, price, variableCostPerUnit) {
  const contribution = price - variableCostPerUnit
  if (contribution <= 0) return null
  return fixedCosts / contribution
}

export function breakEvenRevenue(fixedCosts, price, variableCostPerUnit) {
  const units = breakEvenUnits(fixedCosts, price, variableCostPerUnit)
  if (units == null) return null
  return units * price
}

export function contributionMargin(price, variableCostPerUnit) {
  return price - variableCostPerUnit
}

export function contributionMarginRatio(price, variableCostPerUnit) {
  if (!price) return null
  return (price - variableCostPerUnit) / price
}

/**
 * NPV = −Инвестиции + Σ CFt / (1+r)^t + Терминальная стоимость / (1+r)^N
 * Терминальная стоимость = CF_N × (1+g) / (r − g)
 */
export function computeNPV(initialInvestment, cashFlows, ratePct, terminalGrowthPct) {
  const r = (ratePct || 0) / 100
  const g = (terminalGrowthPct || 0) / 100
  const N = cashFlows.length
  let npv = -(initialInvestment || 0)

  cashFlows.forEach((cf, i) => {
    const t = i + 1
    npv += num(cf) / Math.pow(1 + r, t)
  })

  if (N > 0 && r !== g) {
    const lastCF = num(cashFlows[N - 1])
    const terminalValue = (lastCF * (1 + g)) / (r - g)
    npv += terminalValue / Math.pow(1 + r, N)
  }

  return npv
}

/** IRR — численно, методом бисекции по потоку [−Инвестиции, CF1, …, CFN + Терминальная стоимость] */
export function computeIRR(initialInvestment, cashFlows, terminalGrowthPct) {
  const g = (terminalGrowthPct || 0) / 100
  const N = cashFlows.length
  if (N === 0) return null

  const npvAtRate = (ratePct) => {
    const r = ratePct / 100
    let npv = -(initialInvestment || 0)
    cashFlows.forEach((cf, i) => {
      npv += num(cf) / Math.pow(1 + r, i + 1)
    })
    if (r !== g) {
      const lastCF = num(cashFlows[N - 1])
      const terminalValue = (lastCF * (1 + g)) / (r - g)
      npv += terminalValue / Math.pow(1 + r, N)
    }
    return npv
  }

  let lo = -90 // %
  let hi = 1000 // %
  let npvLo = npvAtRate(lo)
  let npvHi = npvAtRate(hi)

  if (Number.isNaN(npvLo) || Number.isNaN(npvHi) || npvLo * npvHi > 0) {
    return null // нет смены знака в диапазоне — IRR не найден
  }

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const npvMid = npvAtRate(mid)
    if (Math.abs(npvMid) < 1e-6) return mid
    if (npvLo * npvMid < 0) {
      hi = mid
      npvHi = npvMid
    } else {
      lo = mid
      npvLo = npvMid
    }
  }
  return (lo + hi) / 2
}

/** Срок окупаемости — период, в котором накопленный (недисконтированный) поток покрывает инвестиции. */
export function computePaybackPeriod(initialInvestment, cashFlows) {
  let cumulative = 0
  for (let i = 0; i < cashFlows.length; i++) {
    const prevCumulative = cumulative
    cumulative += num(cashFlows[i])
    if (cumulative >= initialInvestment) {
      const cf = num(cashFlows[i])
      const remaining = initialInvestment - prevCumulative
      const fraction = cf !== 0 ? remaining / cf : 0
      return i + fraction
    }
  }
  return null // не окупается в пределах горизонта
}

/** Прогноз сценария на N периодов вперёд от последней фактической выручки. */
export function forecastScenario(lastRevenue, scenario, horizon, taxRatePct) {
  const rows = []
  let revenue = lastRevenue || 0
  const growth = (scenario.revenueGrowth || 0) / 100
  const cogsShare = (scenario.cogsShare || 0) / 100
  const opexShare = (scenario.opexShare || 0) / 100

  for (let i = 1; i <= horizon; i++) {
    revenue = revenue * (1 + growth)
    const cogs = revenue * cogsShare
    const opex = revenue * opexShare
    const pretax = revenue - cogs - opex
    const taxAmt = tax(pretax, taxRatePct)
    const net = netProfit(pretax, taxAmt)
    rows.push({ period: i, revenue, cogs, opex, netProfit: net })
  }
  return rows
}

export function num(v) {
  if (v === '' || v === null || v === undefined) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFlexibleNumber(v)
  return Number.isFinite(n) ? n : 0
}

/** Распознаёт числа в разных форматах: пробелы-разделители тысяч, запятая/точка как дробный разделитель, валютные символы. */
export function parseFlexibleNumber(raw) {
  if (typeof raw === 'number') return raw
  if (raw === null || raw === undefined) return NaN
  let s = String(raw).trim()
  if (!s) return NaN
  // убрать валютные символы и буквы
  s = s.replace(/[₸$€£\s]/g, '')
  // если есть и запятая, и точка — считаем последнюю разделителем дробной части
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // одна запятая, похоже на дробный разделитель
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return n
}

export function formatMoney(value, currency = '₸') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value)
  return `${rounded.toLocaleString('ru-RU')} ${currency}`
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('ru-RU', { maximumFractionDigits: digits })
}
