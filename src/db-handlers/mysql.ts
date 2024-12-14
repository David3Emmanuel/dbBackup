import { Backup } from '../validators/dump-schema'
import { Restore } from '../validators/restore-schema'
import { connectToDb } from './connect-to-db'
import { csv2json, json2csv } from 'json-2-csv'
import { compressFile, uncompressFile } from '../utils/compress'
import { DbKind } from '../types'
import {
  deleteEncryptedDataFile,
  ensureBackupDirectoryExists,
  FileName,
  generateFileName,
  readDecryptedDataFromFile,
  writeEncryptedDataToFile,
} from '../utils/backup_restore'
import { Connection, RowDataPacket } from 'mysql2/promise'

export const mysqlBackupHandler = async (data: Backup) => {
  const db = await connectToDb<Connection>(data, DbKind.Mysql)

  await ensureBackupDirectoryExists()

  const [tables] = await db.query<RowDataPacket[]>('SHOW TABLES')
  const tableNames = tables.map((row: RowDataPacket) => Object.values(row)[0])

  let targetTables: string[] = []

  if (!data.targetTables || data.targetTables.length === 0) {
    targetTables = tableNames
  } else {
    targetTables = tableNames.filter((table) =>
      data.targetTables!.includes(table),
    )
  }

  const versionId = Math.floor(Math.random() * 100)

  const promises = targetTables.map(async (tableName) => {
    const fileName = generateFileName(
      data.backupName,
      data.databaseName,
      tableName,
      versionId,
    )

    await backup({ db, tableName, fileName })
  })
  await Promise.all(promises)

  return versionId
}

const backup = async ({
  db,
  tableName,
  fileName,
}: {
  db: Connection
  tableName: string
  fileName: FileName
}) => {
  const [rows] = await db.query(`SELECT * FROM \`${tableName}\``)
  const csvResult = json2csv(rows as any[])

  await writeEncryptedDataToFile(fileName.localEncrypted, csvResult)
  await compressFile(fileName)
  await deleteEncryptedDataFile(fileName.localEncrypted)
}

export async function mysqlRestoreHandler(
  data: Restore,
  overwrite: boolean,
  tablesToRestore: string[],
) {
  const db = await connectToDb<Connection>(data, DbKind.Mysql)
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
      await db.query(`TRUNCATE TABLE \`${tableName}\``)
    }

    const updateQuery = `INSERT INTO \`${tableName}\` (${columns}) VALUES ${values} ON DUPLICATE KEY UPDATE ${columns
      .split(', ')
      .map((col) => `${col} = VALUES(${col})`)
      .join(', ')}`

    await db.query(updateQuery)
    console.log(`Restored data to table ${tableName}`)
    return tableName
  })
  return Promise.all(promises)
}

async function restore(fileName: FileName) {
  await uncompressFile(fileName)
  const data = await readDecryptedDataFromFile(fileName.localEncrypted)
  deleteEncryptedDataFile(fileName.localEncrypted)
  const contents = csv2json(data)
  return contents
}
