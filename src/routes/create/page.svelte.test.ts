import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Page from './+page.svelte';

async function waitForPhotoCompression() {
	await expect.element(page.getByText('Optimizing your photo…')).not.toBeInTheDocument();
}

describe('Create page', () => {
	test('submit button is initially disabled with "Enter an activity title to continue"', async () => {
		render(Page, { data: { user: null, showGarminBanner: false }, form: null });
		const button = page.getByRole('button', { name: 'Enter an activity title to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('shows error message when form.error is set', async () => {
		render(Page, {
			data: { user: null, showGarminBanner: false },
			form: { error: 'Invalid file format' }
		});
		await expect.element(page.getByText('Invalid file format')).toBeVisible();
	});

	test('button prompts for FIT file when only photo is selected', async () => {
		const { container } = render(Page, {
			data: { user: null, showGarminBanner: false },
			form: null
		});
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(photoInput, new File([''], 'photo.jpg', { type: 'image/jpeg' }));
		await waitForPhotoCompression();
		const button = page.getByRole('button', { name: 'Upload your FIT file to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button prompts for photo when only FIT file is selected', async () => {
		const { container } = render(Page, {
			data: { user: null, showGarminBanner: false },
			form: null
		});
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		const button = page.getByRole('button', { name: 'Upload your photo to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button is enabled with "Generate Card" when both files are selected', async () => {
		const { container } = render(Page, {
			data: { user: null, showGarminBanner: false },
			form: null
		});
		const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement;
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.type(titleInput, 'Graveln');
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		await userEvent.upload(photoInput, new File([''], 'photo.jpg', { type: 'image/jpeg' }));
		await waitForPhotoCompression();
		const button = page.getByRole('button', { name: 'Generate GritShot' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeEnabled();
	});

	test('shows filename and "Click to replace" after FIT file is selected', async () => {
		const { container } = render(Page, {
			data: { user: null, showGarminBanner: false },
			form: null
		});
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		await userEvent.upload(fitInput, new File(['data'], 'my-hike.fit'));
		await expect.element(page.getByText('my-hike.fit')).toBeVisible();
		await expect.element(page.getByText('Click to replace')).toBeVisible();
	});

	test('shows filename and "Click to replace" after photo is selected', async () => {
		const { container } = render(Page, {
			data: { user: null, showGarminBanner: false },
			form: null
		});
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.upload(photoInput, new File(['img'], 'summit.jpg', { type: 'image/jpeg' }));
		await waitForPhotoCompression();
		await expect.element(page.getByText('summit.jpg')).toBeVisible();
		await expect.element(page.getByText('Click to replace')).toBeVisible();
	});

	test('renders main heading and description', async () => {
		render(Page, { data: { user: null, showGarminBanner: false }, form: null });
		await expect.element(page.getByRole('heading', { name: 'Create Your GritShot' })).toBeVisible();
		await expect
			.element(page.getByText('Upload your Garmin FIT file and a trail photo'))
			.toBeVisible();
	});
});
