export function streamToBuffer(readable: NodeJS.ReadableStream) {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        readable.on('data', (data) => chunks.push(data));
        readable.on('end', () => resolve(Buffer.concat(chunks)));
        readable.on('error', reject);
    });
}
