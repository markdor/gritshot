// tests/fixtures/generate-photo-fixtures.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const FIXTURES_DIR = path.join('tests', 'fixtures', 'photos');

function exists(filename: string): boolean {
	return fs.existsSync(path.join(FIXTURES_DIR, filename));
}

async function main() {
	fs.mkdirSync(FIXTURES_DIR, { recursive: true });

	// A JPEG already in the exact card target resolution (1080x1440), used to
	// exercise the server's "skip resize/crop" path in card/generate.ts.
	if (!exists('exact-size.jpg')) {
		await sharp({
			create: { width: 1080, height: 1440, channels: 3, background: { r: 78, g: 115, b: 82 } }
		})
			.jpeg({ quality: 90 })
			.toFile(path.join(FIXTURES_DIR, 'exact-size.jpg'));
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
