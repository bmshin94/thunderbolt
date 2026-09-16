/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { describe, expect, mock, test } from 'bun:test'
import type { StoredFile } from '@/lib/file-blob-storage'

const readXlsxFile = mock(async () => [] as { sheet: string; data: unknown[][] }[])

mock.module('read-excel-file/browser', () => ({
  default: readXlsxFile,
}))

const { xlsxToText } = await import('./xlsx-to-text')

const asFile = (): StoredFile =>
  ({
    id: 'file-1',
    filename: 'book.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 0,
    createdAt: 0,
    blob: new Blob(),
  }) as StoredFile

describe('xlsxToText', () => {
  test('formats a single sheet as a heading plus comma-joined rows', async () => {
    readXlsxFile.mockImplementationOnce(async () => [
      {
        sheet: 'Sheet1',
        data: [
          ['Name', 'Age'],
          ['Ada', 30],
        ],
      },
    ])

    expect(await xlsxToText(asFile())).toEqual({
      text: '## Sheet: Sheet1\nName, Age\nAda, 30',
    })
  })

  test('joins multiple sheets with a blank line between them', async () => {
    readXlsxFile.mockImplementationOnce(async () => [
      { sheet: 'Q1', data: [['Revenue', 100]] },
      { sheet: 'Q2', data: [['Revenue', 150]] },
    ])

    expect(await xlsxToText(asFile())).toEqual({
      text: '## Sheet: Q1\nRevenue, 100\n\n## Sheet: Q2\nRevenue, 150',
    })
  })

  test('renders a null cell as an empty string, not the literal "null"', async () => {
    readXlsxFile.mockImplementationOnce(async () => [{ sheet: 'Sheet1', data: [['A', null, 'C']] }])

    expect(await xlsxToText(asFile())).toEqual({ text: '## Sheet: Sheet1\nA, , C' })
  })

  test('quotes cells containing a comma, quote, or line break', async () => {
    readXlsxFile.mockImplementationOnce(async () => [
      { sheet: 'Sheet1', data: [['Stark, Inc.', 'The "Big" One', 'line one\nline two', 'plain']] },
    ])

    expect(await xlsxToText(asFile())).toEqual({
      text: '## Sheet: Sheet1\n"Stark, Inc.", "The ""Big"" One", "line one\nline two", plain',
    })
  })

  test('formats a date cell against the model-facing English locale', async () => {
    readXlsxFile.mockImplementationOnce(async () => [
      { sheet: 'Sheet1', data: [['Shipped', new Date(Date.UTC(2026, 0, 15))]] },
    ])

    expect(await xlsxToText(asFile())).toEqual({ text: '## Sheet: Sheet1\nShipped, 1/15/2026' })
  })
})
