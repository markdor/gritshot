import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileValidationError } from '../FileValidationError.js';

vi.mock('../jpg/validate.js');
vi.mock('../fit/validate.js');
vi.mock('../fit/process.js');
vi.mock('../zip/validate.js');
vi.mock('../zip/process.js');
vi.mock('sharp', () => ({ default: vi.fn() }));

import { generateCard } from './generate.js';
import { validateJpeg } from '../jpg/validate.js';
import { validateFit } from '../fit/validate.js';
import { parseFitData } from '../fit/process.js';
import { validateZip } from '../zip/validate.js';
import { ZipProcessor } from '../zip/process.js';
import sharp from 'sharp';

function makeFile(name: string, content: Buffer = Buffer.from('data')): File {
	return new File([new Uint8Array(content)], name);
}

const fakeFitData = {
	distance: 42.195,
	durationAction: 7200,
	durationTotal: 7300,
	elevation: 500
};

describe('generateCard', () => {
	let sharpInstance: {
		metadata: ReturnType<typeof vi.fn>;
		resize: ReturnType<typeof vi.fn>;
		extract: ReturnType<typeof vi.fn>;
		blur: ReturnType<typeof vi.fn>;
		composite: ReturnType<typeof vi.fn>;
		jpeg: ReturnType<typeof vi.fn>;
		toBuffer: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		sharpInstance = {
			metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
			resize: vi.fn().mockReturnThis(),
			extract: vi.fn().mockReturnThis(),
			blur: vi.fn().mockReturnThis(),
			composite: vi.fn().mockReturnThis(),
			jpeg: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-image'))
		};

		vi.mocked(sharp).mockReturnValue(sharpInstance as unknown as ReturnType<typeof sharp>);
		vi.mocked(validateJpeg).mockReturnValue(null);
		vi.mocked(validateFit).mockReturnValue(undefined);
		vi.mocked(validateZip).mockResolvedValue(null);
		vi.mocked(parseFitData).mockResolvedValue(fakeFitData);
		vi.mocked(ZipProcessor.prototype.extract).mockResolvedValue({
			name: 'activity.fit',
			content: Buffer.from('fit-content')
		});
	});

	describe('readAndValidatePhoto', () => {
		it('throws when validateJpeg rejects the photo buffer', async () => {
			const error = new FileValidationError('Bad JPEG header', 'Not a valid photo');
			vi.mocked(validateJpeg).mockImplementation(() => {
				throw error;
			});

			await expect(
				generateCard(makeFile('run.fit'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toThrow(FileValidationError);
		});
	});

	describe('readAndValidateFit – plain .fit file', () => {
		it('throws when validateFit rejects the buffer', async () => {
			const error = new FileValidationError('Bad FIT magic', 'Not a valid FIT file');
			vi.mocked(validateFit).mockImplementation(() => {
				throw error;
			});

			await expect(
				generateCard(makeFile('run.fit'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toThrow(FileValidationError);
		});
	});

	describe('readAndValidateFit – ZIP-wrapped .fit file', () => {
		it('throws when validateZip fails', async () => {
			const error = new FileValidationError('Bad ZIP magic', 'Not a valid ZIP');
			vi.mocked(validateZip).mockRejectedValue(error);

			await expect(
				generateCard(makeFile('run.zip'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toThrow(FileValidationError);
		});

		it('wraps ZipProcessor errors in a FileValidationError', async () => {
			vi.mocked(ZipProcessor.prototype.extract).mockRejectedValue(
				new Error('Failed to read stream')
			);

			await expect(
				generateCard(makeFile('run.zip'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toMatchObject({
				name: 'FileValidationError',
				userMessage: 'Could not extract ZIP file',
				message: 'Failed to read stream'
			});
		});

		it('preserves the original error message when ZipProcessor throws a FileValidationError', async () => {
			vi.mocked(ZipProcessor.prototype.extract).mockRejectedValue(
				new FileValidationError('ZIP contains no .fit file', 'Could not extract ZIP file')
			);

			await expect(
				generateCard(makeFile('run.zip'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toMatchObject({
				name: 'FileValidationError',
				message: 'ZIP contains no .fit file',
				userMessage: 'Could not extract ZIP file'
			});
		});

		it('throws when validateFit rejects the extracted buffer', async () => {
			const error = new FileValidationError('Bad FIT magic', 'Not a valid FIT file');
			vi.mocked(validateFit).mockImplementation(() => {
				throw error;
			});

			await expect(
				generateCard(makeFile('run.zip'), makeFile('photo.jpg'), 'Graveln')
			).rejects.toThrow(FileValidationError);
		});
	});

	describe('photo resize', () => {
		it('skips resize/crop when the photo is already exactly 1080x1440', async () => {
			sharpInstance.metadata = vi.fn().mockResolvedValue({ width: 1080, height: 1440 });
			const photoBuffer = Buffer.from('exact-size-photo');

			await generateCard(makeFile('run.fit'), makeFile('photo.jpg', photoBuffer), 'Graveln');

			expect(sharpInstance.resize).not.toHaveBeenCalled();
			const sharpInputs = vi.mocked(sharp).mock.calls.map(([input]) => input);
			expect(sharpInputs).toContainEqual(photoBuffer);
		});

		it('resizes/crops when the photo does not exactly match the target size', async () => {
			sharpInstance.metadata = vi.fn().mockResolvedValue({ width: 800, height: 600 });

			await generateCard(makeFile('run.fit'), makeFile('photo.jpg'), 'Graveln');

			expect(sharpInstance.resize).toHaveBeenCalledWith(1080, 1440, {
				fit: 'cover',
				position: 'centre'
			});
		});
	});

	describe('successful card generation', () => {
		it('returns a Buffer when given a valid .fit file and photo', async () => {
			const result = await generateCard(makeFile('run.fit'), makeFile('photo.jpg'), 'Graveln');

			expect(result).toBeInstanceOf(Buffer);
		});

		it('returns a Buffer when given a valid .zip file and photo', async () => {
			const result = await generateCard(makeFile('run.zip'), makeFile('photo.jpg'), 'Graveln');

			expect(result).toBeInstanceOf(Buffer);
		});
	});
});
