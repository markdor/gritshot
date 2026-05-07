import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RequestEvent } from '@sveltejs/kit';
import { FileValidationError } from '$lib/server/FileValidationError.js';

vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));

import { actions } from './+page.server.js';
import * as generateModule from '$lib/server/card/generate';

type ActionEvent = Parameters<typeof actions.default>[0];

function makeEvent(fitFile: File, photoFile: File, title = 'Graveln'): ActionEvent {
	const formData = new FormData();
	formData.append('title', title);
	formData.append('fitFile', fitFile);
	formData.append('photoFile', photoFile);
	const request = new Request('http://localhost/create', { method: 'POST', body: formData });
	return { request } as unknown as RequestEvent;
}

const zipBuffer = readFileSync(resolve('tests/fixtures/zip/valid.zip'));
const jpgBuffer = readFileSync(resolve('tests/fixtures/photos/valid.jpg'));

describe('create action', () => {
	it('accepts a valid zip and jpg', async () => {
		const fitFile = new File([zipBuffer], 'valid.zip', { type: 'application/zip' });
		const photoFile = new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toMatchObject({
			image: expect.stringMatching(/^\/9j\//),
			title: 'Graveln'
		});
	});

	it('returns error when title is missing', async () => {
		const formData = new FormData();
		formData.append('fitFile', new File([zipBuffer], 'valid.zip', { type: 'application/zip' }));
		formData.append('photoFile', new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' }));
		const request = new Request('http://localhost/create', { method: 'POST', body: formData });
		const result = await actions.default({ request } as unknown as ActionEvent);

		expect(result).toMatchObject({
			status: 422,
			data: { error: 'Please enter an activity title' }
		});
	});

	it('returns error when title exceeds 28 characters', async () => {
		const formData = new FormData();
		formData.append('title', 'A'.repeat(29));
		formData.append('fitFile', new File([zipBuffer], 'valid.zip', { type: 'application/zip' }));
		formData.append('photoFile', new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' }));
		const request = new Request('http://localhost/create', { method: 'POST', body: formData });
		const result = await actions.default({ request } as unknown as ActionEvent);

		expect(result).toMatchObject({
			status: 422,
			data: { error: 'Activity title must not exceed 28 characters' }
		});
	});

	it('returns error when FIT file is missing', async () => {
		const formData = new FormData();
		formData.append('title', 'Graveln');
		formData.append('photoFile', new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' }));
		const request = new Request('http://localhost/create', { method: 'POST', body: formData });
		const result = await actions.default({ request } as unknown as ActionEvent);

		expect(result).toMatchObject({ status: 422, data: { error: 'No FIT file uploaded' } });
	});

	it('returns error when photo is missing', async () => {
		const formData = new FormData();
		formData.append('title', 'Graveln');
		formData.append('fitFile', new File([zipBuffer], 'valid.zip', { type: 'application/zip' }));
		const request = new Request('http://localhost/create', { method: 'POST', body: formData });
		const result = await actions.default({ request } as unknown as ActionEvent);

		expect(result).toMatchObject({ status: 422, data: { error: 'No photo uploaded' } });
	});

	it('returns error when a file exceeds 10 MB', async () => {
		const oversized = new File([new Uint8Array(11 * 1024 * 1024)], 'huge.zip', {
			type: 'application/zip'
		});
		const photoFile = new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(oversized, photoFile));

		expect(result).toMatchObject({ status: 422, data: { error: 'Files must not exceed 10 MB' } });
	});

	it('returns the userMessage when generateCard throws a FileValidationError', async () => {
		vi.spyOn(generateModule, 'generateCard').mockRejectedValueOnce(
			new FileValidationError(
				'FIT parse failed: unexpected EOF',
				'The FIT file appears to be corrupted or incomplete.'
			)
		);

		const fitFile = new File([zipBuffer], 'valid.zip', { type: 'application/zip' });
		const photoFile = new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toMatchObject({
			status: 422,
			data: { error: 'The FIT file appears to be corrupted or incomplete.' }
		});
	});

	it('does not expose internal error details to the user on FileValidationError', async () => {
		const internalMessage = 'buffer overflow at offset 0x42';
		vi.spyOn(generateModule, 'generateCard').mockRejectedValueOnce(
			new FileValidationError(internalMessage, 'Invalid FIT file.')
		);

		const fitFile = new File([zipBuffer], 'valid.zip', { type: 'application/zip' });
		const photoFile = new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toMatchObject({ status: 422 });
		expect(JSON.stringify(result)).not.toContain(internalMessage);
	});

	it('returns HTTP 500 when generateCard throws an unexpected error', async () => {
		vi.spyOn(generateModule, 'generateCard').mockRejectedValueOnce(new Error('Out of memory'));

		const fitFile = new File([zipBuffer], 'valid.zip', { type: 'application/zip' });
		const photoFile = new File([jpgBuffer], 'valid.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toMatchObject({ status: 500, data: { error: 'Failed to generate GritShot' } });
	});
});
