import * as fs from 'node:fs/promises'
import { Encryptor } from './encryptor'

export const ensureBackupDirectoryExists = async () => {
  await fs.mkdir('./backup', { recursive: true })
}

export const writeEncryptedDataToFile = async (fileName: string, data: any) => {
  const encryptor = new Encryptor()
  const encryptedData = encryptor.encrypt(data)

  await fs.appendFile(fileName, Buffer.from(encryptedData), {
    encoding: 'utf8',
  })
  console.log('done writing to file.', fileName)
}

export const deleteEncryptedDataFile = async (fileName: string) => {
  await fs.unlink(fileName)
}

export const readDecryptedDataFromFile = async (fileName: string) => {
  const encryptor = new Encryptor()
  const encryptedData = await fs.readFile(fileName, { encoding: 'utf8' })
  const decryptedData = encryptor.decrypt(encryptedData)
  return decryptedData
}

export interface FileName {
  localEncrypted: string
  localCompressed: string
  remoteCompressed: string
}

export function generateFileName(
  backupName: string,
  databaseName: string,
  tableName: string,
  versionId?: number,
): FileName {
  const versionId_ = versionId || Math.floor(Math.random() * 100)
  const baseFileName = `${backupName}_${versionId_}_${databaseName}.${tableName}`
  return {
    localEncrypted: `./backup/${baseFileName}`,
    localCompressed: `./backup/${baseFileName}.gz`,
    remoteCompressed: `${baseFileName}.gz`,
  }
}
