import yauzl from 'yauzl';

export interface ExtractedFit {
	name: string;
	content: Buffer;
}

export class ZipProcessor {
	async extract(buf: Buffer): Promise<ExtractedFit> {
		return new Promise((resolve, reject) => {
			yauzl.fromBuffer(buf, { lazyEntries: true }, (err, zipfile) => {
				if (err) {
					reject(new Error('Invalid or corrupted ZIP file'));
					return;
				}

				const fitEntries: yauzl.Entry[] = [];

				zipfile.readEntry();

				zipfile.on('entry', (entry: yauzl.Entry) => {
					if (!entry.fileName.endsWith('/') && entry.fileName.toLowerCase().endsWith('.fit')) {
						fitEntries.push(entry);
					}
					zipfile.readEntry();
				});

				zipfile.on('end', () => {
					if (fitEntries.length === 0) {
						reject(new Error('ZIP contains no .fit file'));
						return;
					}
					if (fitEntries.length > 1) {
						reject(new Error('ZIP contains more than one .fit file'));
						return;
					}

					const entry = fitEntries[0];
					zipfile.openReadStream(entry, (streamErr, readStream) => {
						if (streamErr || !readStream) {
							reject(new Error('Failed to read .fit file from ZIP'));
							return;
						}

						const chunks: Buffer[] = [];
						readStream.on('data', (chunk: Buffer) => chunks.push(chunk));
						readStream.on('end', () =>
							resolve({ name: entry.fileName, content: Buffer.concat(chunks) })
						);
						readStream.on('error', (e) => reject(e));
					});
				});

				zipfile.on('error', (e) => reject(e));
			});
		});
	}
}
