import * as Joi from 'joi'
import { DbKind } from '../types'
import { SchemaMap } from './middleware'

export const restoreSchemaValidator = {
  body: Joi.object({
    overwrite: Joi.bool().default(false),
    parameters: Joi.array().items({
      host: Joi.string().required(),
      port: Joi.number(),
      username: Joi.string().required(),
      databaseName: Joi.string().required(),
      backupName: Joi.string(),
      dbKind: Joi.valid(DbKind.Postgres, DbKind.Mongodb, DbKind.Mysql).default(
        DbKind.Postgres,
      ),
      versionId: Joi.number().required(),
      targetTables: Joi.array().items(Joi.string()),
      password: Joi.string().required(),
      useSrv: Joi.bool().default(false),
      queryParams: Joi.string(),
      ssl: Joi.object().unknown(true),
    }),
  }),
} satisfies SchemaMap

export interface Restore {
  host: string
  port?: number
  username: string
  databaseName: string
  dbKind: string
  backupName: string
  versionId: number
  targetTables?: string[]
  password: string
  useSrv?: boolean
  queryParams?: string
  ssl?: any
}
