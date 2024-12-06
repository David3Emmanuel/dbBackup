import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { streamToBuffer } from './streamToBuffer'
import * as fs from 'fs'

import * as dotenv from 'dotenv'
dotenv.config()

class AzureStorage {
  _containerClient?: ContainerClient

  constructor() {
    this.initialize()
  }

  async initialize() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
    if (!accountName) throw new Error('Azure Storage accountName not found')

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    if (!connectionString)
      throw new Error('Azure Storage connectionString not found')

    console.log('Connecting to blob storage...')

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString)

    const containerName = 'backups'
    const containerClient = blobServiceClient.getContainerClient(containerName)
    containerClient.createIfNotExists()

    this._containerClient = containerClient
    console.log('Connected to blob storage')
  }

  containerClient() {
    if (!this._containerClient) {
      throw new Error('Container client not initialized')
    }
    return this._containerClient
  }

  async uploadFileFromBuffer(fileName: string, file: Buffer) {
    const blockBlobClient = this.containerClient().getBlockBlobClient(fileName)
    await blockBlobClient.uploadData(file)
  }

  async uploadFileFromPath(fileName: string, localFilePath: string) {
    const blockBlobClient = this.containerClient().getBlockBlobClient(fileName)
    const data = fs.readFileSync(localFilePath)
    await blockBlobClient.uploadData(data)
  }

  async listFiles() {
    const files = []
    for await (const blob of this.containerClient().listBlobsFlat()) {
      const blobClient = this.containerClient().getBlobClient(blob.name)
      files.push({ name: blobClient.name, url: blobClient.url })
    }
    return files
  }

  async downloadFile(fileName: string) {
    const blockBlobClient = this.containerClient().getBlockBlobClient(fileName)
    const downloadBlockBlobResponse = await blockBlobClient.download(0)
    return await streamToBuffer(downloadBlockBlobResponse.readableStreamBody!)
  }

  async deleteFile(fileName: string) {
    const blockBlobClient = this.containerClient().getBlockBlobClient(fileName)
    await blockBlobClient.delete()
  }

  async deleteAllFiles() {
    for await (const blob of this.containerClient().listBlobsFlat()) {
      const blockBlobClient = this.containerClient().getBlockBlobClient(
        blob.name,
      )
      await blockBlobClient.delete()
    }
  }
}

const storage = new AzureStorage()

export default storage
