import * as fs from 'fs'
import * as zlib from 'zlib'
import { promisify } from 'util'

const pipeline = promisify(require('stream').pipeline)

export const compressFile = async (filePath: string) => {
  const gzip = zlib.createGzip()
  const input = fs.createReadStream(filePath)
  const output = fs.createWriteStream(`${filePath}.gz`)

  await pipeline(input, gzip, output)
}

export const uncompressFile = async (filePath: string) => {
  const gunzip = zlib.createGunzip()
  const input = fs.createReadStream(filePath)
  const output = fs.createWriteStream(filePath.replace(/\.gz$/, ''))

  await pipeline(input, gunzip, output)
}
