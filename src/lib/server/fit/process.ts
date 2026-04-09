import FitParser from 'fit-file-parser';

const parser = new FitParser({
	force: true,
	speedUnit: 'km/h',
	lengthUnit: 'km',
	temperatureUnit: 'celsius',
	pressureUnit: 'bar',
	elapsedRecordField: true,
	mode: 'cascade'
});

export async function parseFitBuffer(buffer: Buffer) {
	return parser.parseAsync(buffer.buffer as ArrayBuffer);
}
