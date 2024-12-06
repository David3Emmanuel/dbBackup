import { Backup } from '../validators'
import { connectToDb } from './connect-to-db'
import * as fs from 'node:fs/promises'
import { json2csv } from 'json-2-csv'
import { compressFile } from '../utils/compress-file'
import { DbKind } from '../types'
import { CollectionInfo, Db as MongoDb } from 'mongodb'
import { ensureBackupDirectoryExists, writeEncryptedDataToFile } from './common'

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

  targetCollections.forEach(async (collection) => {
    const fileName = `./backup/${data.backupName}_${Math.floor(
      Math.random() * 100,
    )}_${collection.name}`

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
