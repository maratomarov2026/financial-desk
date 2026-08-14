// Сопоставление строк первичного файла со статьями отчёта по ключевым словам.
// См. PRD 5.1 «Импорт из первоисточников».

export const STATEMENT_FIELDS = [
  { key: 'revenue', label: 'Выручка', keywords: ['выручка', 'доход от реализ', 'продаж', 'revenue', 'sales', 'оборот'] },
  { key: 'cogs', label: 'Себестоимость', keywords: ['себестоимост', 'cogs', 'cost of', 'прямые затрат'] },
  { key: 'opex', label: 'Опекс', keywords: ['опекс', 'операционные расход', 'коммерческие', 'управленческ', 'opex', 'sg&a'] },
  { key: 'otherIncome', label: 'Прочие доходы', keywords: ['прочие доход', 'прочий доход', 'other income'] },
  { key: 'otherExpense', label: 'Прочие расходы', keywords: ['прочие расход', 'прочий расход', 'other expense'] },
  { key: 'interest', label: 'Проценты к уплате', keywords: ['процент', 'interest', 'обслуживание долга'] },
  { key: 'currentAssets', label: 'Оборотные активы', keywords: ['оборотные актив', 'current assets'] },
  { key: 'currentLiabilities', label: 'Краткосрочные обязательства', keywords: ['краткосрочные обязательств', 'current liabilit'] },
  { key: 'totalAssets', label: 'Активы всего', keywords: ['актив', 'total assets', 'баланс актив', 'итого актив'] },
  { key: 'debt', label: 'Долг', keywords: ['долг', 'заёмные средства', 'заемные средства', 'debt', 'кредит'] },
  { key: 'equity', label: 'Капитал', keywords: ['капитал', 'equity', 'собственные средства'] },
]

/** Пытается сопоставить название строки первичного файла с полем отчёта. */
export function guessField(rowLabel) {
  if (!rowLabel) return null
  const lower = String(rowLabel).toLowerCase()
  for (const field of STATEMENT_FIELDS) {
    if (field.keywords.some((kw) => lower.includes(kw))) {
      return field.key
    }
  }
  return null
}

/** Строит автоматическое сопоставление для набора строк листа [{label, index}] */
export function autoMapRows(rows) {
  const mapping = {}
  rows.forEach((row, idx) => {
    const guess = guessField(row)
    if (guess && !Object.values(mapping).includes(idx)) {
      mapping[guess] = idx
    }
  })
  return mapping
}
