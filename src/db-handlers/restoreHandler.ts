import { Request, Response, Router } from 'express'
import { Restore, restoreSchemaValidator } from '../validators/restore-schema'
import { mongoDBRestoreHandler } from './mongodb'
import { postgresRestoreHandler } from './postgres'
import { mysqlRestoreHandler } from './mysql'
import { DbKind } from '../types'
import { registerRoute } from '../swagger'
import storage from '../storage'

async function getTablesToRestore(restore: Restore): Promise<string[]> {
  if (!restore.targetTables || restore.targetTables.length === 0) {
    const files = await storage.listFiles()
    console.log(files)
    const regex = new RegExp(
      `${restore.backupName}_${restore.versionId}_${restore.databaseName}.(.*).gz$`,
    )
    const tablesToRestore = files
      .filter((file) => regex.test(file.name))
      .map((file) => regex.exec(file.name)![1])
    if (tablesToRestore.length === 0) throw new Error('Backup not found')
    return tablesToRestore
  } else {
    return restore.targetTables
  }
}

const restoreRouter = Router()

const restoreHandler = async (req: Request, res: Response) => {
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
      } else if (restore.dbKind == DbKind.Mysql) {
        let result = await mysqlRestoreHandler(
          restore,
          overwrite,
          tablesToRestore,
        )
        results.push(result)
      }
    } catch (e) {
      console.error(e)
      res.status(207)
      results.push({ error: e.message, versionId: restore.versionId })
    }
  }
  res.end(JSON.stringify(results))
}

registerRoute(restoreRouter, {
  method: 'post',
  description: 'Restore the database',
  handler: restoreHandler,
  path: '/',
  fullPath: '/restore',
  summary: 'Restore the database',
  schema: restoreSchemaValidator,
})

export default restoreRouter
