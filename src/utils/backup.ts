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

export const generateFileName = (backupName: string, tableName: string) => {
  return `./backup/${backupName}_${Math.floor(
    Math.random() * 100,
  )}_${tableName}`
}
