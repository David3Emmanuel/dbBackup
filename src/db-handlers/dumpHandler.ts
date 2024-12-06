import { Request, Response, Router } from 'express'
import { DbKind } from '../types'
import { Backup, dumpSchemaValidator } from '../validators/dump-schema'
import { mongoDBBackupHandler } from './mongodb'
import { postgresBackupHandler } from './postgres'
import { registerRoute } from '../swagger'

const dumpRouter = Router()

const dumpHandler = async (req: Request, res: Response) => {
  const scheduledBackups = req.body.parameters as Backup[]

  if (!scheduledBackups) {
    res
      .status(400)
      .end('Invalid request structure. Expected "parameters" array')
    return
  }

  let results: number[] = []
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

registerRoute(dumpRouter, {
  method: 'post',
  description: 'Backup the database',
  handler: dumpHandler,
  path: '/dump',
  summary: 'Backup the database',
  schema: dumpSchemaValidator,
})

export default dumpRouter
