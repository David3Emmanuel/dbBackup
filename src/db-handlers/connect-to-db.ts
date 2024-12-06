import { Backup } from '../validators'
import { MongoClient, Db as MongoDb } from 'mongodb'
import { Pool, PoolClient } from 'pg'
import { DbKind } from '../types'
import assert from 'node:assert'

export const connectToDb = async <T extends MongoDb | PoolClient>(
  data: Backup,
  type: DbKind,
): Promise<T> => {
  const { username, databaseName, host, port, password, useSrv, queryParams } =
    data

  if (type === DbKind.Mongodb) {
    const protocol = useSrv ? 'mongodb+srv' : 'mongodb'
    const uri = `${protocol}://${username}:${password}@${host}${
      useSrv ? '' : `:${port}`
    }/${databaseName}${queryParams ? `?${queryParams}` : ''}`
    const client = new MongoClient(uri)
    await client.connect()
    return client.db(databaseName) as T
  } else if (type === DbKind.Postgres) {
    assert(port, 'Port is required for Postgres')
    const pool = new Pool({
      user: username,
      host,
      database: databaseName,
      password,
      port,
    })
    const client = await pool.connect()
    return client as T
  } else {
    throw new Error('Unsupported database type')
  }
}
