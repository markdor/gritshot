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