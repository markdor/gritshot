import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Page from './+page.svelte';

describe('Create page', () => {
	test('submit button is initially disabled with "Upload both files to continue"', async () => {
		render(Page, { form: null });
		const button = page.getByRole('button', { name: 'Upload both files to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('shows error message when form.error is set', async () => {
		render(Page, { form: { error: 'Invalid file format' } });
		await expect.element(page.getByText('Invalid file format')).toBeVisible();
	});

	test('button prompts for FIT file when only photo is selected', async () => {
		const { container } = render(Page, { form: null });
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.upload(photoInput, new File([''], 'photo.jpg', { type: 'image/jpeg' }));
		const button = page.getByRole('button', { name: 'Upload your FIT file to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button prompts for photo when only FIT file is selected', async () => {
		const { container } = render(Page, { form: null });
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		const button = page.getByRole('button', { name: 'Upload your photo to continue' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeDisabled();
	});

	test('button is enabled with "Generate Card" when both files are selected', async () => {
		const { container } = render(Page, { form: null });
		const fitInput = container.querySelector('input[name="fitFile"]') as HTMLInputElement;
		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.upload(fitInput, new File([''], 'activity.fit'));
		await userEvent.upload(photoInput, new File([''], 'photo.jpg', { type: 'image/jpeg' }));
		const button = page.getByRole('button', { name: 'Generate Card' });
		await expect.element(button).toBeVisible();
		await expect.element(button).toBeEnabled();
	});
});
