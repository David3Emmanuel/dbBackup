import * as fs from 'fs'
import * as zlib from 'zlib'
import { promisify } from 'util'
import { FileName } from './backup_restore'

const pipeline = promisify(require('stream').pipeline)

export const compressFile = async (fileName: FileName) => {
  const gzip = zlib.createGzip()
  const input = fs.createReadStream(fileName.localEncrypted)
  const output = fs.createWriteStream(fileName.localCompressed)

  await pipeline(input, gzip, output)
}

export const uncompressFile = async (fileName: FileName) => {
  const gunzip = zlib.createGunzip()
  const input = fs.createReadStream(fileName.localCompressed)
  const output = fs.createWriteStream(fileName.localEncrypted)

  await pipeline(input, gunzip, output)
}
