import { Request, Response } from 'express'
import { Restore } from '../validators'
import { mongoDBRestoreHandler } from './mongodb'
import { postgresRestoreHandler } from './postgres'
import { DbKind } from '../types'
import * as fs from 'fs'
import * as path from 'path'

async function getTablesToRestore(restore: Restore): Promise<string[]> {
  if (!restore.targetTables || restore.targetTables.length === 0) {
    const backupDir = path.join(__dirname, '../../backup')
    const files = fs.readdirSync(backupDir)
    const regex = new RegExp(
      `${restore.backupName}_${restore.versionId}_${restore.databaseName}.(.*).gz$`,
    )
    const tablesToRestore = files
      .filter((file) => regex.test(file))
      .map((file) => regex.exec(file)![1])
    if (tablesToRestore.length === 0) throw new Error('Backup not found')
    return tablesToRestore
  } else {
    return restore.targetTables
  }
}

export default async function restoreHandler(req: Request, res: Response) {
  const restores = req.body.parameters as Restore[]
  const overwrite = req.body.overwrite as boolean

  if (!restores) {
    res
      .status(400)
      .end('Invalid request structure. Expected "parameters" array')
    return
  }

  let results: (string[] | { error: string; versionId: number })[] = []
  for (let restore of restores) {
    try {
      const tablesToRestore = await getTablesToRestore(restore)

      if (restore.dbKind == DbKind.Postgres) {
        let result = await postgresRestoreHandler(
          restore,
          overwrite,
          tablesToRestore,
        )
        results.push(result)
      } else if (restore.dbKind == DbKind.Mongodb) {
        let result = await mongoDBRestoreHandler(
          restore,
          overwrite,
          tablesToRestore,
        )
        results.push(result)
      }
    } catch (e) {
      console.error({ error: e.message })
      res.status(207)
      results.push({ error: e.message, versionId: restore.versionId })
    }
  }
  res.end(JSON.stringify(results))
}
