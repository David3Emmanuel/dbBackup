import { Request, Response } from 'express'
import { Restore } from '../validators'
import { mongoDBRestoreHandler } from './mongodb'
import { postgresRestoreHandler } from './postgres'
import { DbKind } from '../types'

export default async function restoreHandler(req: Request, res: Response) {
  const restores = req.body.parameters as Restore[]
  const overwrite = req.body.overwrite as boolean

  if (!restores) {
    res
      .status(400)
      .end('Invalid request structure. Expected "parameters" array')
    return
  }

  let results: any[] = []
  for (let restore of restores) {
    try {
      if (restore.dbKind == DbKind.Postgres) {
        let result = await postgresRestoreHandler(restore, overwrite)
        results.push(result)
      } else if (restore.dbKind == DbKind.Mongodb) {
        let result = await mongoDBRestoreHandler(restore, overwrite)
        results.push(result)
      }
    } catch (e) {
      res.status(207)
      results.push({ error: 'Backup not found', versionId: restore.versionId })
    }
  }
  res.end(JSON.stringify(results))
}
