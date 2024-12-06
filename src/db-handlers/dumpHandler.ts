import { Request, Response } from 'express'
import { DbKind } from '../types'
import { Backup } from '../validators'
import { mongoDBBackupHandler } from './mongodb'
import { postgresBackupHandler } from './postgres'

export default async function dumpHandler(req: Request, res: Response) {
  const scheduledBackups = req.body.parameters as Backup[]

  if (!scheduledBackups) {
    res
      .status(400)
      .end('Invalid request structure. Expected "parameters" array')
    return
  }

  let results: any[] = []
  for (let backup of scheduledBackups) {
    if (backup.dbKind == DbKind.Postgres) {
      let result = await postgresBackupHandler(backup)
      results.push(result)
    } else if (backup.dbKind == DbKind.Mongodb) {
      let result = await mongoDBBackupHandler(backup)
      results.push(result)
    }
  }
  res.end(JSON.stringify(results))
}
