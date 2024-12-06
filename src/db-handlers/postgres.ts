import { Backup } from '../validators'
import { connectToDb } from './connect-to-db'
import { json2csv } from 'json-2-csv'
import { PoolClient } from 'pg'
import { compressFile } from '../utils/compress'
import { DbKind } from '../types'
import {
  ensureBackupDirectoryExists,
  generateFileName,
  writeEncryptedDataToFile,
} from '../utils/backup_restore'

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

export const postgresBackupHandler = async (data: Backup) => {
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
  const versionId = Math.floor(Math.random() * 100)

  targetTables.forEach(async (ttable: Table) => {
    const fileName = generateFileName(
      data.backupName,
      data.databaseName,
      ttable.name,
      versionId,
    )

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
