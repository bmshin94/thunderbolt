/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import type { StoredFile } from '@/lib/file-blob-storage'
import { sourceLocale } from '@shared/i18n/locales'
import type { CellValue } from 'read-excel-file/browser'

/** Renders one cell as plain text. Dates format against the model-facing
 *  English locale, matching how the rest of the app renders dates for the
 *  model rather than the user (see `src/ai/prompt.ts`). */
const cellText = (value: CellValue | null): string => {
  if (value === null) {
    return ''
  }
  if (value instanceof Date) {
    return value.toLocaleDateString(sourceLocale)
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
