import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Page from './+page.svelte';

async function waitForPhotoCompression() {
	await expect.element(page.getByText('Optimizing your photo…')).not.toBeInTheDocument();
}

function makeValidPhoto(name = 'photo.jpg'): File {
	const canvas = document.createElement('canvas');
	canvas.width = 10;
	canvas.height = 10;
	canvas.getContext('2d')!.fillRect(0, 0, 10, 10);
	const dataUrl = canvas.toDataURL('image/png');
	const bytes = atob(dataUrl.split(',')[1]);
	const buf = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
	return new File([buf], name, { type: 'image/jpeg' });
}

describe('Create page', () => {
	test('submit button is initially disabled with "Enter an activity title to continue"', async () => {
		render(Page, { form: null });
		const button = page.getByRole('button', { name: 'Enter an activity title to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('shows error message when form.error is set', async () => {
		render(Page, { form: { error: 'Invalid file format' } });
		await expect.element(page.getByText('Invalid file format')).toBeVisible();
	});

	test('button prompts for FIT file when only photo is selected', async () => {
		const { container } = render(Page, { form: null });
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(photoInput, makeValidPhoto());
		await waitForPhotoCompression();
		const button = page.getByRole('button', { name: 'Upload your FIT file to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button prompts for photo when only FIT file is selected', async () => {
		const { container } = render(Page, { form: null });
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		const button = page.getByRole('button', { name: 'Upload your photo to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button is enabled with "Generate Card" when both files are selected', async () => {
		const { container } = render(Page, { form: null });
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		await userEvent.upload(photoInput, makeValidPhoto());
		await waitForPhotoCompression();
		const button = page.getByRole('button', { name: 'Generate GritShot' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeEnabled();
	});

	test('shows filename and "Click to replace" after FIT file is selected', async () => {
		const { container } = render(Page, { form: null });
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		await userEvent.upload(fitInput, new File(['data'], 'my-hike.fit'));
		await expect.element(page.getByText('my-hike.fit')).toBeVisible();
		await expect.element(page.getByText('Click to replace')).toBeVisible();
	});

	test('shows filename and "Click to replace" after photo is selected', async () => {
		const { container } = render(Page, { form: null });
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.upload(photoInput, makeValidPhoto('summit.jpg'));
		await waitForPhotoCompression();
		await expect.element(page.getByText('summit.jpg')).toBeVisible();
		await expect.element(page.getByText('Click to replace')).toBeVisible();
	});

	test('shows a processing error and keeps the button disabled when the photo cannot be compressed', async () => {
		const { container } = render(Page, { form: null });
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		const undecodablePhoto = new File([new Uint8Array([1, 2, 3])], 'broken.jpg', {
			type: 'image/jpeg'
		});
		await userEvent.upload(photoInput, undecodablePhoto);
		await waitForPhotoCompression();

		await expect
			.element(page.getByText('This photo could not be processed. Please try a different photo.'))
			.toBeVisible();
		await expect.element(page.getByText('Drop your photo here')).toBeVisible();
		expect(photoInput.files?.length).toBe(0);
	});

	test('renders main heading and description', async () => {
		render(Page, { form: null });
		await expect.element(page.getByRole('heading', { name: 'Create Your GritShot' })).toBeVisible();
		await expect
			.element(page.getByText('Upload your Garmin FIT file and a trail photo'))
			.toBeVisible();
	});
});
