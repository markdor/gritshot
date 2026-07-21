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

const activity = (id: number, name: string) => ({
	activityId: id,
	name,
	type: 'trail_running',
	startTimeLocal: '2026-05-22 06:00:00',
	distanceKm: 12.5,
	durationSec: 3600,
	elevationM: 420
});

describe('Garmin create page', () => {
	test('renders empty state with connect CTA when not connected', async () => {
		render(Page, {
			data: { user: null, connected: false },
			form: null
		});

		await expect.element(page.getByText('No Garmin connection yet')).toBeVisible();
		const cta = page.getByRole('link', { name: 'Connect Garmin' });
		await expect.element(cta).toBeVisible();
		await expect.element(cta).toHaveAttribute('href', '/garmin/connect');
	});

	test('shows "no recent activities" when connected but list is empty', async () => {
		render(Page, {
			data: { user: null, connected: true, activities: [], error: null },
			form: null
		});

		await expect
			.element(page.getByText('No recent activities found on your Garmin account.'))
			.toBeVisible();
	});

	test('renders the load error banner when present', async () => {
		render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [],
				error: 'Garmin is unreachable right now. Please try again in a moment.'
			},
			form: null
		});

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Garmin is unreachable right now');
	});

	test('pre-selects the first activity and pre-fills the title', async () => {
		const { container } = render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'Sunrise Run'), activity(2, 'Evening Spin')],
				error: null
			},
			form: null
		});

		const hidden = container.querySelector('input[name="activityId"]') as HTMLInputElement;
		expect(hidden.value).toBe('1');

		const title = container.querySelector('input[name="title"]') as HTMLInputElement;
		expect(title.value).toBe('Sunrise Run');
	});

	test('changing the activity updates the hidden input and the title', async () => {
		const { container } = render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'Sunrise Run'), activity(2, 'Evening Spin')],
				error: null
			},
			form: null
		});

		await userEvent.click(page.getByRole('radio', { name: /Evening Spin/ }));

		const hidden = container.querySelector('input[name="activityId"]') as HTMLInputElement;
		const title = container.querySelector('input[name="title"]') as HTMLInputElement;
		expect(hidden.value).toBe('2');
		expect(title.value).toBe('Evening Spin');
	});

	test('submit is disabled until a photo is uploaded; then enabled with "Generate GritShot"', async () => {
		const { container } = render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'Sunrise Run')],
				error: null
			},
			form: null
		});

		// Before upload: prompts for the photo.
		const promptBtn = page.getByRole('button', { name: 'Upload your photo to continue' });
		await expect.element(promptBtn).toBeVisible();
		await expect.element(promptBtn).toBeDisabled();

		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		await userEvent.upload(photoInput, makeValidPhoto());
		await waitForPhotoCompression();

		const generateBtn = page.getByRole('button', { name: 'Generate GritShot' });
		await expect.element(generateBtn).toBeVisible();
		await expect.element(generateBtn).toBeEnabled();
	});

	test('shows a processing error and keeps the button disabled when the photo cannot be compressed', async () => {
		const { container } = render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'Sunrise Run')],
				error: null
			},
			form: null
		});

		const photoInput = container.querySelector('input[name="photoFile"]') as HTMLInputElement;
		const undecodablePhoto = new File([new Uint8Array([1, 2, 3])], 'broken.jpg', {
			type: 'image/jpeg'
		});
		await userEvent.upload(photoInput, undecodablePhoto);
		await waitForPhotoCompression();

		await expect
			.element(page.getByText('This photo could not be processed. Please try a different photo.'))
			.toBeVisible();
		const promptBtn = page.getByRole('button', { name: 'Upload your photo to continue' });
		await expect.element(promptBtn).toBeDisabled();
		expect(photoInput.files?.length).toBe(0);
	});

	test('truncates activity names longer than 28 chars when seeding the title', async () => {
		const { container } = render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'A really really really long activity name here')],
				error: null
			},
			form: null
		});

		const title = container.querySelector('input[name="title"]') as HTMLInputElement;
		expect(title.value.length).toBeLessThanOrEqual(28);
	});

	test('shows the action error message when form.error is set', async () => {
		render(Page, {
			data: {
				user: null,
				connected: true,
				activities: [activity(1, 'Run')],
				error: null
			},
			form: { error: 'Could not download that activity from Garmin.' }
		});

		await expect
			.element(page.getByText('Could not download that activity from Garmin.'))
			.toBeVisible();
	});
});
