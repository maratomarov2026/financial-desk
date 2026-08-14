// Референсный бизнес-кейс из PRD (раздел 4) — курсы повышения квалификации.
// Используется кнопкой «Загрузить пример» для быстрого знакомства с инструментом.

export function buildSampleState() {
  const periods = ['Поток 1 (15 чел)', 'Поток 2 (18 чел)', 'Поток 3 (20 чел)']

  const price = 62000
  const costPerStudent = 50000
  const fixedCosts = 40000
  const groupSizes = [15, 18, 20]

  const revenue = groupSizes.map((n) => n * price)
  const cogs = groupSizes.map((n) => n * costPerStudent)
  const opex = groupSizes.map(() => fixedCosts)

  return {
    periods,
    taxRatePct: 0,
    pnl: {
      revenue,
      cogs,
      opex,
      otherIncome: periods.map(() => 0),
      otherExpense: periods.map(() => 0),
      interest: periods.map(() => 0),
    },
    balance: {
      currentAssets: periods.map(() => ''),
      currentLiabilities: periods.map(() => ''),
      totalAssets: periods.map(() => ''),
      debt: periods.map(() => ''),
      equity: periods.map(() => ''),
    },
    breakeven: {
      fixedCosts,
      price,
      variableCostPerUnit: costPerStudent,
    },
  }
}
