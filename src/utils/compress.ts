import * as fs from 'fs'
import * as zlib from 'zlib'
import { promisify } from 'util'
import { FileName } from './backup_restore'
import storage from '../storage'

const pipeline = promisify(require('stream').pipeline)

export const compressFile = async (fileName: FileName) => {
  const gzip = zlib.createGzip()
  const input = fs.createReadStream(fileName.localEncrypted)
  const output = fs.createWriteStream(fileName.localCompressed)

  await pipeline(input, gzip, output)

  await storage.uploadFileFromPath(
    fileName.remoteCompressed,
    fileName.localCompressed,
  )
  fs.unlinkSync(fileName.localCompressed)
}

export const uncompressFile = async (fileName: FileName) => {
  const compressedFileBuffer = await storage.downloadFile(
    fileName.remoteCompressed,
  )
  fs.writeFileSync(fileName.localCompressed, compressedFileBuffer)

  const gunzip = zlib.createGunzip()
  const input = fs.createReadStream(fileName.localCompressed)
  const output = fs.createWriteStream(fileName.localEncrypted)

  await pipeline(input, gunzip, output)

  fs.unlinkSync(fileName.localCompressed)
}
