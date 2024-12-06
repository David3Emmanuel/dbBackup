import { Request, Response } from 'express'
import { Restore } from '../validators'
import {
  generateFileName,
  readDecryptedDataFromFile,
} from '../utils/backup_restore'
import { csv2json } from 'json-2-csv'

export default async function restoreHandler(req: Request, res: Response) {
  const restores = req.body.parameters as Restore[]

  if (!restores) {
    res
      .status(400)
      .end('Invalid request structure. Expected "parameters" array')
    return
  }

  let results: any[] = []
  for (let restore of restores) {
    let result = await genericHandler(restore)
    console.log(result)
    results.push(result)
  }
  res.end(JSON.stringify(results))
}

async function genericHandler(data: Restore) {
  const { backupName, databaseName, targetTables, versionId } = data
  const promises = targetTables.map(async (tableName) => {
    const fileName = generateFileName(
      backupName,
      databaseName,
      tableName,
      versionId,
    )
    const data = await readDecryptedDataFromFile(fileName)
    const contents = csv2json(data)
    console.log(contents)
    return { tableName, contents }
  })
  return Promise.all(promises)
}
