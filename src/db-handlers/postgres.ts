import { Backup } from '../validators/dump-schema'
import { Restore } from '../validators/restore-schema'

import { connectToDb } from './connect-to-db'
import { csv2json, json2csv } from 'json-2-csv'
import { PoolClient } from 'pg'
import { compressFile, uncompressFile } from '../utils/compress'
import { DbKind } from '../types'
import {
  deleteEncryptedDataFile,
  ensureBackupDirectoryExists,
  generateFileName,
  readDecryptedDataFromFile,
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

  if (!data.targetTables || data.targetTables.length === 0) {
    targetTables = tables
  } else {
    targetTables = tables.filter((table: Table) =>
      data.targetTables!.includes(table.name),
    )
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
  })

  return versionId
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
  const csvResult = json2csv(tableData.rows as any[])

  await writeEncryptedDataToFile(fileName, csvResult)
  await compressFile(fileName)
  await deleteEncryptedDataFile(fileName)
}

export async function postgresRestoreHandler(
  data: Restore,
  overwrite: boolean,
  tablesToRestore: string[],
) {
  const db = await connectToDb<PoolClient>(data, DbKind.Postgres)
  await ensureBackupDirectoryExists()

  const { backupName, databaseName, versionId } = data

  const promises = tablesToRestore.map(async (tableName) => {
    const fileName = generateFileName(
      backupName,
      databaseName,
      tableName,
      versionId,
    )
    const contents = await restore(fileName)
    const columns = Object.keys(contents[0]).join(', ')
    const values = contents
      .map(
        (row) =>
          `(${Object.values(row)
            .map((value) => `'${value}'`)
            .join(', ')})`,
      )
      .join(', ')

    if (overwrite) {
      await db.query(`TRUNCATE TABLE "${tableName}"`)
    }

    const updateQuery = `INSERT INTO "${tableName}" (${columns}) VALUES ${values} ON CONFLICT (id) DO UPDATE SET ${columns
      .split(', ')
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(', ')}`

    await db.query(updateQuery)
    console.log(`Restored data to table ${tableName}`)
    return tableName
  })
  return Promise.all(promises)
}

async function restore(fileName: string) {
  await uncompressFile(fileName + '.gz')
  const data = await readDecryptedDataFromFile(fileName)
  deleteEncryptedDataFile(fileName)
  const contents = csv2json(data)
  return contents
}
