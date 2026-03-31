// src/lib/server/zip/validator.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateZip } from './validate';

const fixture = (name: string) =>
  fs.readFileSync(path.join('tests', 'fixtures', 'zip', name));

describe('validateZip', () => {
  it('akzeptiert ein valides ZIP mit FIT-Dateien', async () => {
    const result = await validateZip(fixture('valid.zip'));
    expect(result).toBeNull();
  });

  it('lehnt verdächtige Compression Ratio ab', async () => {
    const result = await validateZip(fixture('ratio-bomb.zip'));
    expect(result).toMatch("ZIP uncompressed content exceeds 20 MB");
  });

  it('lehnt überschrittene unkomprimierte Gesamtgröße ab', async () => {
    const result = await validateZip(fixture('size-bomb.zip'));
    expect(result).toMatch("ZIP uncompressed content exceeds 20 MB");
  });

  it('erkennt Path Traversal', async () => {
    const result = await validateZip(fixture('path-traversal.zip'));
    expect(result).toMatch("ZIP contains disallowed file type:");
  });

  it('lehnt verbotene Dateierweiterungen ab', async () => {
    const result = await validateZip(fixture('bad-extension.zip'));
    expect(result).toMatch("ZIP contains disallowed file type: \".sh\"");
  });

  it('lehnt zu viele Dateien ab', async () => {
    const result = await validateZip(fixture('too-many-files.zip'));
    expect(result).toMatch("ZIP contains too many entries (max 1)");
  });

  it('lehnt fehlende Magic Bytes ab', async () => {
    const result = await validateZip(fixture('fake-magic.zip'));
    expect(result).toMatch("File is not a valid ZIP file");
  });
});