import * as Joi from 'joi'
import { DbKind, Schedules } from '../types'

export const dumpSchemaValidator = Joi.object({
  parameters: Joi.array().items({
    host: Joi.string().required(),
    port: Joi.number(),
    username: Joi.string().required(),
    databaseName: Joi.string().required(),
    backupName: Joi.string(),
    dbKind: Joi.valid(DbKind.Postgres, DbKind.Mongodb).default(DbKind.Postgres),
    enableAutomaticBackupScheduling: Joi.bool().default(false),
    schedule: Joi.valid(
      Schedules.EVERY_3_Hours,
      Schedules.Every_12_HOURS,
    ).default(Schedules.EVERY_3_Hours),
    targetTables: Joi.array().items(Joi.string()),
    password: Joi.string().required(),
    useSrv: Joi.bool().default(false),
    queryParams: Joi.string(),
  }),
})

export interface Backup {
  host: string
  port?: number
  username: string
  databaseName: string
  dbKind: string
  backupName: string
  targetTables?: string[]
  password: string
  useSrv?: boolean
  queryParams?: string
}
