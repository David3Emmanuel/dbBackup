import * as fs from 'fs'
import * as zlib from 'zlib'

export const compressFile = (filePath: string) => {
  // Create a Gzip compression stream
  const gzip = zlib.createGzip()

  // Read the input file
  const input = fs.createReadStream(filePath)

  // Write the compressed output to a new file
  const output = fs.createWriteStream(`${filePath}.gz`)

  // Pipe the input through Gzip and write to the output
  input.pipe(gzip).pipe(output)
}

export const uncompressFile = (filePath: string) => {
  // Create a Gunzip decompression stream
  const gunzip = zlib.createGunzip()

  // Read the input file
  const input = fs.createReadStream(filePath)

  // Write the decompressed output to a new file
  const output = fs.createWriteStream(filePath.replace(/\.gz$/, ''))

  // Pipe the input through Gunzip and write to the output
  input.pipe(gunzip).pipe(output)
}
