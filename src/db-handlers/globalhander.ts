import { Request, Response } from 'express'
import { Backup } from '../validators'
import { DbKind } from '../types'
import { postgresHandler } from './postgres'
import { mongoDBHandler } from './mongodb'

export const dumpHandler = async (req: Request, res: Response) => {
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
      let result = await postgresHandler(backup)
      results.push(result)
    } else if (backup.dbKind == DbKind.Mongodb) {
      let result = await mongoDBHandler(backup)
      results.push(result)
    }
  }
  res.end(JSON.stringify(results))
}

export const restoreHandler = async (req: Request, res: Response) => {
  res.end('Not implemented yet')
}
