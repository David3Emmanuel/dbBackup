import { Backup } from '../validators/dump-schema'
import { Restore } from '../validators/restore-schema'

import { connectToDb } from './connect-to-db'
import { csv2json, json2csv } from 'json-2-csv'
import { compressFile, uncompressFile } from '../utils/compress'
import { DbKind } from '../types'
import { CollectionInfo, Db as MongoDb } from 'mongodb'
import {
  deleteEncryptedDataFile,
  ensureBackupDirectoryExists,
  FileName,
  generateFileName,
  readDecryptedDataFromFile,
  writeEncryptedDataToFile,
} from '../utils/backup_restore'

export const mongoDBBackupHandler = async (data: Backup) => {
  const db = await connectToDb<MongoDb>(data, DbKind.Mongodb)

  await ensureBackupDirectoryExists()

  const collections = await db.listCollections().toArray()

  let targetCollections: (
    | CollectionInfo
    | Pick<CollectionInfo, 'name' | 'type'>
  )[] = []

  if (!data.targetTables || data.targetTables.length === 0) {
    targetCollections = collections
  } else {
    targetCollections = collections.filter((collection) =>
      data.targetTables!.includes(collection.name),
    )
  }

  const versionId = Math.floor(Math.random() * 100)

  const promises = targetCollections.map(async (collection) => {
    const fileName = generateFileName(
      data.backupName,
      data.databaseName,
      collection.name,
      versionId,
    )

    await backup({ db, collection, fileName })
  })
  await Promise.all(promises)

  return versionId
}

const backup = async ({
  db,
  collection,
  fileName,
}: {
  db: MongoDb
  collection: any
  fileName: FileName
}) => {
  const collectionData = await db.collection(collection.name).find().toArray()
  const csvResult = json2csv(collectionData)

  await writeEncryptedDataToFile(fileName.localEncrypted, csvResult)
  await compressFile(fileName)
  await deleteEncryptedDataFile(fileName.localEncrypted)
}

export async function mongoDBRestoreHandler(
  data: Restore,
  overwrite: boolean,
  collectionsToRestore: string[],
) {
  const db = await connectToDb<MongoDb>(data, DbKind.Mongodb)
  await ensureBackupDirectoryExists()

  const { backupName, databaseName, versionId } = data

  const promises = collectionsToRestore.map(async (tableName) => {
    const fileName = generateFileName(
      backupName,
      databaseName,
      tableName,
      versionId,
    )
    const contents = await restore(fileName)
    const bulkOps = contents.map((doc: object & { _id: any }) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true,
      },
    }))

    if (overwrite) {
      await db.collection(tableName).deleteMany({})
    }

    await db.collection(tableName).bulkWrite(bulkOps)
    console.log(`Restored data to collection ${tableName}`)
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
