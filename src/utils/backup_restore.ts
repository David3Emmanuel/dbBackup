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

export const readDecryptedDataFromFile = async (fileName: string) => {
  const encryptor = new Encryptor()
  const encryptedData = await fs.readFile(fileName, { encoding: 'utf8' })
  const decryptedData = encryptor.decrypt(encryptedData)
  return decryptedData
}

export const generateFileName = (
  backupName: string,
  databaseName: string,
  tableName: string,
  versionId?: number,
) => {
  const versionId_ = versionId || Math.floor(Math.random() * 100)
  return `./backup/${backupName}_${versionId_}_${databaseName}.${tableName}`
}
