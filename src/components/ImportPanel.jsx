import React, { useMemo, useState } from 'react'
import { Upload, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import { STATEMENT_FIELDS, autoMapRows } from '../lib/importMapping.js'
import { parseFlexibleNumber } from '../lib/calculations.js'

const PNL_KEYS = ['revenue', 'cogs', 'opex', 'otherIncome', 'otherExpense', 'interest']
const BALANCE_KEYS = ['currentAssets', 'currentLiabilities', 'totalAssets', 'debt', 'equity']

export default function ImportPanel({ onMerge }) {
  const [fileName, setFileName] = useState('')
  const [sheetData, setSheetData] = useState(null) // 2D array
  const [headerRowIdx, setHeaderRowIdx] = useState(0)
  const [nameColIdx, setNameColIdx] = useState(0)
  const [mapping, setMapping] = useState({}) // field -> row index
  const [mergedMsg, setMergedMsg] = useState('')

  const rowCount = sheetData ? sheetData.length : 0
  const colCount = sheetData ? Math.max(...sheetData.map((r) => r.length), 0) : 0

  const rowLabels = useMemo(() => {
    if (!sheetData) return []
    return sheetData.map((row) => row[nameColIdx])
  }, [sheetData, nameColIdx])

  const periodColumns = useMemo(() => {
    if (!sheetData) return []
    const headerRow = sheetData[headerRowIdx] || []
    const cols = []
    for (let c = 0; c < colCount; c++) {
      if (c === nameColIdx) continue
      if (headerRow[c] !== undefined && headerRow[c] !== '') cols.push(c)
    }
    return cols
  }, [sheetData, headerRowIdx, nameColIdx, colCount])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setMergedMsg('')

    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const workbook = XLSX.read(buf, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })

    setSheetData(rows)
    setHeaderRowIdx(0)
    setNameColIdx(0)

    const labels = rows.map((r) => r[0])
    setMapping(autoMapRows(labels))
  }

  function updateMapping(field, rowIdx) {
    setMapping((prev) => ({ ...prev, [field]: rowIdx === '' ? undefined : Number(rowIdx) }))
  }

  function handleMerge() {
    if (!sheetData) return
    const headerRow = sheetData[headerRowIdx] || []
    const newPeriods = periodColumns.map((c) => String(headerRow[c] ?? `Столбец ${c + 1}`))

    const newPnlByField = {}
    PNL_KEYS.forEach((key) => {
      const rowIdx = mapping[key]
      newPnlByField[key] = periodColumns.map((c) => {
        if (rowIdx === undefined) return 0
        const raw = sheetData[rowIdx]?.[c]
        const n = parseFlexibleNumber(raw)
        return Number.isFinite(n) ? n : 0
      })
    })

    const newBalanceByField = {}
    BALANCE_KEYS.forEach((key) => {
      const rowIdx = mapping[key]
      newBalanceByField[key] = periodColumns.map((c) => {
        if (rowIdx === undefined) return ''
        const raw = sheetData[rowIdx]?.[c]
        const n = parseFlexibleNumber(raw)
        return Number.isFinite(n) ? n : ''
      })
    })

    onMerge(newPeriods, newPnlByField, newBalanceByField)
    setMergedMsg(`Добавлено периодов: ${newPeriods.length}`)
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={18} className="text-accent" />
        <h3 className="font-medium">Импорт из первоисточников</h3>
      </div>
      <p className="text-sm text-slate-400">
        Загрузите выгрузку .xlsx, .xls или .csv (используется первый лист файла). Укажите строку-заголовок
        (периоды) и столбец с названием статьи — остальное сопоставится автоматически по ключевым словам.
      </p>

      <label className="btn-secondary cursor-pointer w-fit">
        <Upload size={16} />
        {fileName || 'Выбрать файл'}
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      </label>

      {sheetData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="label">Строка-заголовок (периоды)</span>
              <select
                className="input"
                value={headerRowIdx}
                onChange={(e) => setHeaderRowIdx(Number(e.target.value))}
              >
                {sheetData.slice(0, Math.min(rowCount, 30)).map((row, i) => (
                  <option key={i} value={i}>
                    Строка {i + 1}: {row.slice(0, 4).join(' | ') || '(пусто)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Столбец с названием статьи</span>
              <select className="input" value={nameColIdx} onChange={(e) => setNameColIdx(Number(e.target.value))}>
                {Array.from({ length: colCount }).map((_, i) => (
                  <option key={i} value={i}>
                    Столбец {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="label">Предпросмотр (первые строки)</span>
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="data-table">
                <tbody>
                  {sheetData.slice(0, 6).map((row, i) => (
                    <tr key={i} className={i === headerRowIdx ? 'bg-accent/10' : ''}>
                      {row.slice(0, 8).map((cell, j) => (
                        <td key={j} className={j === nameColIdx ? 'text-accent' : ''}>
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <span className="label">Сопоставление строк со статьями отчёта</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATEMENT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-sm w-44 shrink-0 text-slate-300">{field.label}</span>
                  <select
                    className="input"
                    value={mapping[field.key] ?? ''}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                  >
                    <option value="">— не сопоставлено —</option>
                    {rowLabels.map((label, i) => (
                      <option key={i} value={i}>
                        Стр. {i + 1}: {String(label ?? '')}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Найдено периодов (столбцов): <b className="text-slate-200">{periodColumns.length}</b>
          </div>

          <button className="btn-primary" onClick={handleMerge}>
            <CheckCircle2 size={16} />
            Свести данные в отчёт
          </button>

          {mergedMsg && <div className="text-sm text-accent2">{mergedMsg}</div>}
        </>
      )}
    </div>
  )
}
