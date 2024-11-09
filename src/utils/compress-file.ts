import * as fs from "fs";
import * as zlib from "zlib";

export const compressFile = (filePath: string) => {
  // Create a Gzip compression stream
  const gzip = zlib.createGzip();

  // Read the input file
  const input = fs.createReadStream(filePath);

  // Write the compressed output to a new file
  const output = fs.createWriteStream(`${filePath}.gz`);

  // Pipe the input through Gzip and write to the output
  input.pipe(gzip).pipe(output);
};
