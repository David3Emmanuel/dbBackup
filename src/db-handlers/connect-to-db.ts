import { Backup } from '../validators/dump-schema'
import { MongoClient, Db as MongoDb } from 'mongodb'
import { Pool, PoolClient } from 'pg'
import { createConnection, Connection } from 'mysql2/promise'
import { DbKind } from '../types'

export const connectToDb = async <T extends MongoDb | PoolClient | Connection>(
  data: Backup,
  type: DbKind,
): Promise<T> => {
  const {
    username,
    databaseName,
    host,
    port,
    password,
    useSrv,
    queryParams,
    ssl,
  } = data

  if (type === DbKind.Mongodb) {
    const protocol = useSrv ? 'mongodb+srv' : 'mongodb'
    const uri = `${protocol}://${username}:${password}@${host}${
      useSrv ? '' : `:${port}`
    }/${databaseName}${queryParams ? `?${queryParams}` : ''}`
    const client = new MongoClient(uri)
    await client.connect()
    return client.db(databaseName) as T
  } else if (type === DbKind.Postgres) {
    if (!port) throw new Error('Port is required for Postgres')
    const pool = new Pool({
      user: username,
      host,
      database: databaseName,
      password,
      port,
      ssl,
    })
    const client = await pool.connect()
    return client as T
  } else if (type === DbKind.Mysql) {
    if (!port) throw new Error('Port is required for MySQL')
    const connection = await createConnection({
      host,
      user: username,
      database: databaseName,
      password,
      port,
      ssl,
    })
    return connection as T
  } else {
    throw new Error('Unsupported database type')
  }
}
