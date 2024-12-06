import { Backup } from '../validators'
import { connectToDb } from './connect-to-db'
import { json2csv } from 'json-2-csv'
import { compressFile } from '../utils/compress'
import { DbKind } from '../types'
import { CollectionInfo, Db as MongoDb } from 'mongodb'
import {
  ensureBackupDirectoryExists,
  generateFileName,
  writeEncryptedDataToFile,
} from '../utils/backup_restore'

export const mongoDBHandler = async (data: Backup) => {
  const db = await connectToDb<MongoDb>(data, DbKind.Mongodb)

  await ensureBackupDirectoryExists()

  const collections = await db.listCollections().toArray()

  let targetCollections: (
    | CollectionInfo
    | Pick<CollectionInfo, 'name' | 'type'>
  )[] = []

  if (data.targetTables[0] !== '*') {
    collections.forEach((collection) => {
      if (data.targetTables.includes(collection.name)) {
        targetCollections.push(collection)
      }
    })
  } else {
    targetCollections = collections
  }

  const versionId = Math.floor(Math.random() * 100)

  targetCollections.forEach(async (collection) => {
    const fileName = generateFileName(
      data.backupName,
      data.databaseName,
      collection.name,
      versionId,
    )

    await backup({ db, collection, fileName })
    compressFile(fileName)
  })
}

const backup = async ({
  db,
  collection,
  fileName,
}: {
  db: MongoDb
  collection: any
  fileName: string
}) => {
  const collectionData = await db.collection(collection.name).find().toArray()
  const csvResult = await json2csv(collectionData)

  await writeEncryptedDataToFile(fileName, csvResult)
}
