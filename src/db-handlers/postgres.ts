import { Backup } from '../validators'
import { connectToDb } from './connect-to-db'
import { pipeline } from 'node:stream'
import * as fs from 'node:fs/promises'
import * as zlib from 'node:zlib'
import { json2csv } from 'json-2-csv'
import { PoolClient } from 'pg'
import { compressFile } from '../utils/compress-file'
import { DbKind } from '../types'
import { ensureBackupDirectoryExists, writeEncryptedDataToFile } from './common'

const query = `SELECT
    schemaname AS schema,
    tablename AS name,
    tableowner AS owner
FROM
    pg_catalog.pg_tables
WHERE
    schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    schemaname, tablename;
`

interface Table {
  schema: string
  name: string
  owner: string
}

export const postgresHandler = async (data: Backup) => {
  const db = await connectToDb<PoolClient>(data, DbKind.Postgres)

  await ensureBackupDirectoryExists()

  const result = await db.query(query)
  const tables = result.rows

  let targetTables: Table[] = []

  if (data.targetTables[0] !== '*') {
    tables.forEach((table: Table) => {
      if (data.targetTables.includes(table.name)) {
        targetTables.push(table)
      }
    })
  } else {
    targetTables = tables
  }

  targetTables.forEach(async (ttable: Table) => {
    const fileName = `./backup/${data.backupName}_${Math.floor(
      Math.random() * 100,
    )}_${ttable.name}`

    await backup({ db, table: ttable, data, fileName })
    compressFile(fileName)
  })
}

const backup = async ({
  db,
  table,
  data,
  fileName,
}: {
  db: PoolClient
  table: Table
  data: Backup
  fileName: string
}) => {
  const tableData = await db.query(`SELECT * FROM "${table.name}"`)
  const csvResult = await json2csv(tableData.rows as any[])

  await writeEncryptedDataToFile(fileName, csvResult)
}
