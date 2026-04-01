// tests/fixtures/generate-zip-fixtures.ts
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const FIXTURES_DIR = path.join('tests', 'fixtures', 'zip');

async function createZipWithRatio(
  filename: string,
  uncompressedMB: number
) {
  // Hochkomprimierbarer Inhalt: wiederholte Bytes (wie echte Zipbomben)
  const uncompressedBytes = uncompressedMB * 1024 * 1024;
  const payload = Buffer.alloc(uncompressedBytes, 0x00); // Nullbytes = maximale Kompression

  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(path.join(FIXTURES_DIR, filename));
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.append(payload, { name: 'payload.fit' });
    archive.finalize();

    output.on('close', resolve);
    archive.on('error', reject);
  });
}

function exists(filename: string): boolean {
  return fs.existsSync(path.join(FIXTURES_DIR, filename));
}

async function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // ✅ Legitimes ZIP mit echten FIT-Dateien
  // → liegt als echte Datei im Repo: tests/fixtures/zip/valid.zip

  // 💣 Ratio-Bombe: kleines ZIP, explodierende Entpackgröße
  if (!exists('ratio-bomb.zip')) await createZipWithRatio('ratio-bomb.zip', 50); // > MAX_COMPRESSION_RATIO

  // 💣 Size-Bombe: unkomprimierte Größe überschreitet absolutes Limit
  if (!exists('size-bomb.zip')) await createZipWithRatio('size-bomb.zip', 200); // > MAX_UNCOMPRESSED_SIZE (200 MB)

  // 💣 Path Traversal
  if (!exists('path-traversal.zip')) {
    const traversalZip = path.join(FIXTURES_DIR, 'path-traversal.zip');
    const archive = archiver('zip');
    archive.pipe(fs.createWriteStream(traversalZip));
    archive.append(Buffer.from('malicious'), { name: '../../../etc/passwd' });
    await new Promise<void>(r => { archive.finalize(); archive.on('close', r); });
  }

  // 💣 Verbotene Dateierweiterung
  if (!exists('bad-extension.zip')) {
    const extZip = path.join(FIXTURES_DIR, 'bad-extension.zip');
    const archive2 = archiver('zip');
    archive2.pipe(fs.createWriteStream(extZip));
    archive2.append(Buffer.from('#!/bin/bash'), { name: 'script.sh' });
    await new Promise<void>(r => { archive2.finalize(); archive2.on('close', r); });
  }

  // 💣 Gefälschte Magic Bytes (kein echtes ZIP)
  if (!exists('fake-magic.zip')) {
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'fake-magic.zip'),
      Buffer.concat([Buffer.from([0xFF, 0xFE, 0x00, 0x00]), Buffer.from('not a zip')])
    );
  }

  // 💣 Korruptes ZIP: valide Magic Bytes, aber kaputter Inhalt
  if (!exists('corrupt.zip')) {
    fs.writeFileSync(
      path.join(FIXTURES_DIR, 'corrupt.zip'),
      Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('CORRUPT_GARBAGE')])
    );
  }

  // 💣 Verschlüsseltes ZIP: generalPurposeBitFlag bit 0 gesetzt
  if (!exists('encrypted.zip')) {
    // Minimales valides ZIP, manuell konstruiert, mit Encryption-Bit gesetzt.
    // yauzl prüft bei stored+encrypted: compressedSize = uncompressedSize + 12 (Encryption-Header).
    // uncompressedSize=4, compressedSize=16 (4+12).
    // Local file header: 30 header + 8 name + 16 data = 54 bytes (offset 0x00)
    // Central directory:  46 header + 8 name       = 54 bytes (offset 0x36)
    // EOCD:                                           22 bytes (offset 0x6c)
    const buf = Buffer.from([
      // Local file header (offset 0x00)
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed: 2.0
      0x01, 0x00,             // general purpose bit flag: bit 0 = encrypted
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x10, 0x00, 0x00, 0x00, // compressed size: 16 (= 4 uncompressed + 12 encryption header)
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x08, 0x00,             // filename length: 8
      0x00, 0x00,             // extra field length: 0
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x66, 0x69, 0x74, // "test.fit"
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // encryption header (12 bytes)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // + encrypted data (4 bytes)
      // Central directory (offset 0x36 = 54)
      0x50, 0x4b, 0x01, 0x02, // signature
      0x14, 0x00,             // version made by
      0x14, 0x00,             // version needed
      0x01, 0x00,             // general purpose bit flag: bit 0 = encrypted
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x10, 0x00, 0x00, 0x00, // compressed size: 16
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x08, 0x00,             // filename length: 8
      0x00, 0x00,             // extra field length: 0
      0x00, 0x00,             // file comment length: 0
      0x00, 0x00,             // disk number start: 0
      0x00, 0x00,             // internal file attributes
      0x00, 0x00, 0x00, 0x00, // external file attributes
      0x00, 0x00, 0x00, 0x00, // local header offset: 0
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x66, 0x69, 0x74, // "test.fit"
      // End of central directory (offset 0x6c = 108)
      0x50, 0x4b, 0x05, 0x06, // signature
      0x00, 0x00,             // disk number: 0
      0x00, 0x00,             // disk with start of CD: 0
      0x01, 0x00,             // entries on this disk: 1
      0x01, 0x00,             // total entries: 1
      0x36, 0x00, 0x00, 0x00, // CD size: 54
      0x36, 0x00, 0x00, 0x00, // CD offset: 54
      0x00, 0x00,             // comment length: 0
    ]);
    fs.writeFileSync(path.join(FIXTURES_DIR, 'encrypted.zip'), buf);
  }

  // 💣 Verdächtige Compression Ratio (per Entry): uncompressedSize=10MB, compressedSize=1000
  // → Ratio 10485 > MAX_COMPRESSION_RATIO (100), aber totalUncompressed < 20MB (Size-Check kommt zuerst).
  // compressionMethod=8 (deflate) nötig: yauzl's validateEntrySizes greift nur bei method=0 (stored).
  // Local file header: 30 + 8 (name) + 1000 (data) = 1038 bytes (offset 0x00)
  // Central dir:       46 + 8 (name)               =   54 bytes (offset 0x0000040E = 1038)
  // EOCD:                                               22 bytes (offset 0x00000444 = 1092)
  if (!exists('ratio-entry.zip')) {
    const filenameBytes = Buffer.from('test.fit');           // 8 bytes
    const compressedSize  = 1000;
    const uncompressedSize = 10 * 1024 * 1024;              // 10 MB
    const fileData = Buffer.alloc(compressedSize, 0x00);
    const cdOffset = 30 + 8 + compressedSize;               // 1038

    const localHeader = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed: 2.0
      0x00, 0x00,             // general purpose bit flag
      0x08, 0x00,             // compression: deflate (8)
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0xE8, 0x03, 0x00, 0x00, // compressedSize: 1000 (0x3E8)
      0x00, 0x00, 0xA0, 0x00, // uncompressedSize: 10MB (0xA00000)
      0x08, 0x00,             // filename length: 8
      0x00, 0x00,             // extra field length: 0
    ]);

    const centralDir = Buffer.from([
      0x50, 0x4b, 0x01, 0x02, // signature
      0x14, 0x00,             // version made by
      0x14, 0x00,             // version needed
      0x00, 0x00,             // general purpose bit flag
      0x08, 0x00,             // compression: deflate (8)
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0xE8, 0x03, 0x00, 0x00, // compressedSize: 1000
      0x00, 0x00, 0xA0, 0x00, // uncompressedSize: 10MB
      0x08, 0x00,             // filename length: 8
      0x00, 0x00,             // extra field length: 0
      0x00, 0x00,             // file comment length: 0
      0x00, 0x00,             // disk number start: 0
      0x00, 0x00,             // internal file attributes
      0x00, 0x00, 0x00, 0x00, // external file attributes
      0x00, 0x00, 0x00, 0x00, // local header offset: 0
    ]);

    const cdSize = 46 + 8; // 54
    const eocd = Buffer.from([
      0x50, 0x4b, 0x05, 0x06, // signature
      0x00, 0x00,             // disk number: 0
      0x00, 0x00,             // disk with start of CD: 0
      0x01, 0x00,             // entries on this disk: 1
      0x01, 0x00,             // total entries: 1
      0x36, 0x00, 0x00, 0x00, // CD size: 54
      // CD offset: 1038 = 0x0000040E
      (cdOffset & 0xFF), (cdOffset >> 8) & 0xFF, (cdOffset >> 16) & 0xFF, (cdOffset >> 24) & 0xFF,
      0x00, 0x00,             // comment length: 0
    ]);

    const buf = Buffer.concat([localHeader, filenameBytes, fileData, centralDir, filenameBytes, eocd]);
    fs.writeFileSync(path.join(FIXTURES_DIR, 'ratio-entry.zip'), buf);
  }

  // 💣 Path Traversal: "test..fit" (9 Bytes) — ".." als Substring, kein Pfadsegment,
  // passiert yauzl's validateFileName (split("/").indexOf("..") === -1),
  // wird aber von unserem name.includes('..') erkannt.
  // Local header: 30 + 9 + 4 = 43 bytes (offset 0x00)
  // Central dir:  46 + 9     = 55 bytes (offset 0x2b = 43)
  // EOCD:                      22 bytes (offset 0x62 = 98)
  if (!exists('path-traversal-substring.zip')) {
    const filename = [0x74, 0x65, 0x73, 0x74, 0x2e, 0x2e, 0x66, 0x69, 0x74]; // "test..fit"
    const buf = Buffer.from([
      // Local file header (offset 0x00)
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed: 2.0
      0x00, 0x00,             // general purpose bit flag
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x04, 0x00, 0x00, 0x00, // compressed size: 4
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x09, 0x00,             // filename length: 9
      0x00, 0x00,             // extra field length: 0
      ...filename,            // "test..fit"
      0x00, 0x00, 0x00, 0x00, // file data (4 bytes)
      // Central directory (offset 0x2b = 43)
      0x50, 0x4b, 0x01, 0x02, // signature
      0x14, 0x00,             // version made by
      0x14, 0x00,             // version needed
      0x00, 0x00,             // general purpose bit flag
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x04, 0x00, 0x00, 0x00, // compressed size: 4
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x09, 0x00,             // filename length: 9
      0x00, 0x00,             // extra field length: 0
      0x00, 0x00,             // file comment length: 0
      0x00, 0x00,             // disk number start: 0
      0x00, 0x00,             // internal file attributes
      0x00, 0x00, 0x00, 0x00, // external file attributes
      0x00, 0x00, 0x00, 0x00, // local header offset: 0
      ...filename,            // "test..fit"
      // End of central directory (offset 0x62 = 98)
      0x50, 0x4b, 0x05, 0x06, // signature
      0x00, 0x00,             // disk number: 0
      0x00, 0x00,             // disk with start of CD: 0
      0x01, 0x00,             // entries on this disk: 1
      0x01, 0x00,             // total entries: 1
      0x37, 0x00, 0x00, 0x00, // CD size: 55
      0x2b, 0x00, 0x00, 0x00, // CD offset: 43
      0x00, 0x00,             // comment length: 0
    ]);
    fs.writeFileSync(path.join(FIXTURES_DIR, 'path-traversal-substring.zip'), buf);
  }

  // 💣 Null-Byte im Dateinamen (z.B. "test\0.fit", 9 Bytes)
  // Local header: 30 + 9 + 4 = 43 bytes (offset 0x00)
  // Central dir:  46 + 9     = 55 bytes (offset 0x2b)
  // EOCD:                      22 bytes (offset 0x62)
  if (!exists('null-byte-filename.zip')) {
    const nullByteFilename = [0x74, 0x65, 0x73, 0x74, 0x00, 0x2e, 0x66, 0x69, 0x74]; // "test\0.fit"
    const buf = Buffer.from([
      // Local file header (offset 0x00)
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,             // version needed: 2.0
      0x00, 0x00,             // general purpose bit flag
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x04, 0x00, 0x00, 0x00, // compressed size: 4
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x09, 0x00,             // filename length: 9
      0x00, 0x00,             // extra field length: 0
      ...nullByteFilename,    // "test\0.fit"
      0x00, 0x00, 0x00, 0x00, // file data (4 bytes)
      // Central directory (offset 0x2b = 43)
      0x50, 0x4b, 0x01, 0x02, // signature
      0x14, 0x00,             // version made by
      0x14, 0x00,             // version needed
      0x00, 0x00,             // general purpose bit flag
      0x00, 0x00,             // compression: stored
      0x00, 0x00,             // mod time
      0x00, 0x00,             // mod date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x04, 0x00, 0x00, 0x00, // compressed size: 4
      0x04, 0x00, 0x00, 0x00, // uncompressed size: 4
      0x09, 0x00,             // filename length: 9
      0x00, 0x00,             // extra field length: 0
      0x00, 0x00,             // file comment length: 0
      0x00, 0x00,             // disk number start: 0
      0x00, 0x00,             // internal file attributes
      0x00, 0x00, 0x00, 0x00, // external file attributes
      0x00, 0x00, 0x00, 0x00, // local header offset: 0
      ...nullByteFilename,    // "test\0.fit"
      // End of central directory (offset 0x62 = 98)
      0x50, 0x4b, 0x05, 0x06, // signature
      0x00, 0x00,             // disk number: 0
      0x00, 0x00,             // disk with start of CD: 0
      0x01, 0x00,             // entries on this disk: 1
      0x01, 0x00,             // total entries: 1
      0x37, 0x00, 0x00, 0x00, // CD size: 55
      0x2b, 0x00, 0x00, 0x00, // CD offset: 43
      0x00, 0x00,             // comment length: 0
    ]);
    fs.writeFileSync(path.join(FIXTURES_DIR, 'null-byte-filename.zip'), buf);
  }

  // 💣 Verzeichniseintrag
  if (!exists('directory-entry.zip')) {
    const dirZip = archiver('zip');
    dirZip.pipe(fs.createWriteStream(path.join(FIXTURES_DIR, 'directory-entry.zip')));
    dirZip.append(Buffer.alloc(0), { name: 'subdir/' });
    await new Promise<void>(r => { dirZip.finalize(); dirZip.on('close', r); });
  }

  // 💣 Zu viele Dateien
  if (!exists('too-many-files.zip')) {
    const manyFilesZip = archiver('zip');
    manyFilesZip.pipe(fs.createWriteStream(path.join(FIXTURES_DIR, 'too-many-files.zip')));
    for (let i = 0; i < 100; i++) {
      manyFilesZip.append(Buffer.from('data'), { name: `file-${i}.fit` });
    }
    await new Promise<void>(r => { manyFilesZip.finalize(); manyFilesZip.on('close', r); });
  }

  console.log('Fixtures generated.');
}

main();