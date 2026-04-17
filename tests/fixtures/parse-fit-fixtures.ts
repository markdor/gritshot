// tests/fixtures/parse-fit-fixtures.ts
import FitParser from 'fit-file-parser';
import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = path.join('tests', 'fixtures', 'fit');

const parser = new FitParser({
	force: true,
	speedUnit: 'km/h',
	lengthUnit: 'km',
	temperatureUnit: 'celsius',
	pressureUnit: 'bar',
	elapsedRecordField: true,
	mode: 'cascade'
});

async function main() {
	const fitFiles = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.fit'));

	if (fitFiles.length === 0) {
		console.log('No .fit files found in', FIXTURES_DIR);
		return;
	}

	for (const fitFile of fitFiles) {
		const fitPath = path.join(FIXTURES_DIR, fitFile);
		const jsonPath = path.join(FIXTURES_DIR, fitFile.replace(/\.fit$/, '.json'));

		const buffer = fs.readFileSync(fitPath);
		const parsed = await parser.parseAsync(buffer.buffer as ArrayBuffer);

		fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, '\t'));
		console.log(`Parsed: ${fitFile} → ${path.basename(jsonPath)}`);
	}
}

main();
