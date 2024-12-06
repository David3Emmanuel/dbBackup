import * as crypto from 'node:crypto'

export class Encryptor {
  private readonly _algorithm = 'aes-256-cbc'
  private readonly _key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  private readonly _iv: Buffer = crypto.randomBytes(16)

  decrypt(encryptedText: string, key?: string | Buffer): string {
    try {
      if (!key) {
        key = this._key
      }

      const textParts = encryptedText.split(':')
      const iv = Buffer.from(textParts.shift()!, 'hex')
      const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex')

      const decipher = crypto.createDecipheriv(this._algorithm, key, iv)
      const decryptedText = Buffer.concat([
        decipher.update(encryptedTextBuffer),
        decipher.final(),
      ])

      return decryptedText.toString()
    } catch (err) {
      return ''
    }
  }

  encrypt(plainText: string, key?: string | Buffer): string {
    if (!key) {
      key = this._key
    }

    const cipher = crypto.createCipheriv(this._algorithm, this._key, this._iv)
    const encryptedText = Buffer.concat([
      cipher.update(plainText),
      cipher.final(),
    ])

    return `${this._iv.toString('hex')}:${encryptedText.toString('hex')}`
  }
}
