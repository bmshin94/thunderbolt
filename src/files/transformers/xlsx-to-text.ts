/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { StoredFile } from '@/lib/file-blob-storage'
import { sourceLocale } from '@shared/i18n/locales'
import type { CellValue } from 'read-excel-file/browser'

/**
 * Renders a spreadsheet date as the calendar date (and time, when it has one)
 * written in the cell. Spreadsheets store dates without a timezone and
 * read-excel-file represents them as UTC, so formatting in UTC reproduces the
 * cell exactly; formatting in local time would shift the day for anyone west of
 * Greenwich. Uses the model-facing English locale (see `src/ai/prompt.ts`).
 */
const formatSpreadsheetDate = (value: Date): string => {
  const hasTime = value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0
  if (!hasTime) {
    return value.toLocaleDateString(sourceLocale, { timeZone: 'UTC' })
  }
  return value.toLocaleString(sourceLocale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(value.getUTCSeconds() !== 0 && { second: '2-digit' }),
  })
}

/** Renders one cell as plain text. */
const cellText = (value: CellValue | null): string => {
  if (value === null) {
    return ''
  }
  if (value instanceof Date) {
    return formatSpreadsheetDate(value)
  }
  return String(value)
}

/** Quotes a field that contains a separator, quote, or line break, doubling any
 *  embedded quotes, so `Stark, Inc.` stays one cell instead of reading as two. */
const csvField = (text: string): string => (/[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text)

/**
 * Extracts a plain-text table dump from an XLSX blob via a lazily-imported
 * read-excel-file. Multiple sheets are concatenated with a heading per sheet so
 * the model can tell them apart; rows are joined as CSV-ish text rather than a
 * Markdown table, since spreadsheet column counts and widths vary too widely
 * for a fixed-width table to stay readable.
 */
export const xlsxToText = async (file: StoredFile): Promise<{ text: string }> => {
  const { default: readXlsxFile } = await import('read-excel-file/browser')
  const sheets = await readXlsxFile(file.blob)
  const text = sheets
    .map(({ sheet, data }) => {
      const rows = data.map((row) => row.map((cell) => csvField(cellText(cell))).join(', ')).join('\n')
      return `## Sheet: ${sheet}\n${rows}`
    })
    .join('\n\n')
  return { text: text.trim() }
}
