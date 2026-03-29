import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';

type ActionEvent = Parameters<typeof actions.default>[0];

function makeEvent(fitFile: File, photoFile: File): ActionEvent {
	const formData = new FormData();
	formData.append('fitFile', fitFile);
	formData.append('photoFile', photoFile);
	const request = new Request('http://localhost/create', { method: 'POST', body: formData });
	return { request } as unknown as RequestEvent;
}

const zipBuffer = readFileSync(resolve('tests/fixtures/fit-files/gravel_sample.zip'));
const invalidZipBuffer = readFileSync(resolve('tests/fixtures/fit-files/invalid_zip_format.zip'));
const jpgBuffer = readFileSync(resolve('tests/fixtures/photos/gravel_sample.jpg'));

describe('create action', () => {
	it('accepts a valid gravel_sample.zip + gravel_sample.jpg', async () => {
		const fitFile = new File([zipBuffer], 'gravel_sample.zip', { type: 'application/zip' });
		const photoFile = new File([jpgBuffer], 'gravel_sample.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toEqual({ success: true });
	});

	it('rejects invalid_zip_format.zip with a format error', async () => {
		const fitFile = new File([invalidZipBuffer], 'invalid_zip_format.zip', {
			type: 'application/zip'
		});
		const photoFile = new File([jpgBuffer], 'gravel_sample.jpg', { type: 'image/jpeg' });

		const result = await actions.default(makeEvent(fitFile, photoFile));

		expect(result).toMatchObject({ status: 422, data: { error: 'FIT file must be a valid .fit or .zip file' } });
	});
});
