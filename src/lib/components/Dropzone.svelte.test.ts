import { describe, test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import Dropzone from './Dropzone.svelte';

const icon = createRawSnippet(() => ({ render: () => `<span></span>` }));

const defaultProps = {
	name: 'testFile',
	accept: '.fit',
	step: 'Step 1',
	title: 'Test Upload',
	label: 'Drop file here',
	hint: '.fit accepted',
	validate: (f: File) => f.name.endsWith('.fit'),
	file: null,
	icon
};

function dropFile(container: HTMLElement, file: File) {
	const label = container.querySelector('label') as HTMLElement;
	const dt = new DataTransfer();
	dt.items.add(file);
	label.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
}

describe('Dropzone', () => {
	describe('initial state', () => {
		test('shows upload prompt', async () => {
			render(Dropzone, defaultProps);
			await expect.element(page.getByText('Drop file here')).toBeVisible();
			await expect.element(page.getByText('or click to browse')).toBeVisible();
			await expect.element(page.getByText('.fit accepted')).toBeVisible();
		});
	});

	describe('file selection via input', () => {
		test('shows filename and "Click to replace" after selection', async () => {
			const { container } = render(Dropzone, defaultProps);
			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([''], 'activity.fit'));
			await expect.element(page.getByText('activity.fit')).toBeVisible();
			await expect.element(page.getByText('Click to replace')).toBeVisible();
		});

		test('formats size in bytes', async () => {
			const { container } = render(Dropzone, defaultProps);
			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(500)], 'a.fit'));
			await expect.element(page.getByText('500 B')).toBeVisible();
		});

		test('formats size in kilobytes', async () => {
			const { container } = render(Dropzone, defaultProps);
			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(1500)], 'a.fit'));
			await expect.element(page.getByText('1.5 KB')).toBeVisible();
		});

		test('formats size in megabytes', async () => {
			const { container } = render(Dropzone, defaultProps);
			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(1_500_000)], 'a.fit'));
			await expect.element(page.getByText('1.4 MB')).toBeVisible();
		});
	});

	describe('drag and drop', () => {
		test('accepts a valid file', async () => {
			const { container } = render(Dropzone, defaultProps);
			dropFile(container, new File([''], 'activity.fit'));
			await expect.element(page.getByText('activity.fit')).toBeVisible();
		});

		test('rejects an invalid file', async () => {
			const { container } = render(Dropzone, defaultProps);
			dropFile(container, new File([''], 'photo.jpg'));
			await expect.element(page.getByText('Drop file here')).toBeVisible();
		});
	});

	describe('transform', () => {
		test('replaces the selected file with the transform result', async () => {
			const transformed = new File([new Uint8Array(10)], 'transformed.fit');
			const transform = vi.fn().mockResolvedValue(transformed);
			const { container } = render(Dropzone, { ...defaultProps, transform });

			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(500)], 'activity.fit'));

			expect(transform).toHaveBeenCalledOnce();
			await expect.element(page.getByText('transformed.fit')).toBeVisible();
			expect(input.files?.[0]).toBe(transformed);
		});

		test('clears the file and shows the error message when the transform rejects', async () => {
			const transform = vi.fn().mockRejectedValue(new Error('cannot decode image'));
			const { container } = render(Dropzone, {
				...defaultProps,
				transform,
				transformErrorMessage: 'Could not process this file.'
			});

			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(500)], 'activity.fit'));

			expect(transform).toHaveBeenCalledOnce();
			await expect.element(page.getByText('Could not process this file.')).toBeVisible();
			await expect.element(page.getByText('Drop file here')).toBeVisible();
			expect(input.files?.length).toBe(0);
		});

		test('re-selecting a file after a failed transform clears the error', async () => {
			const transform = vi.fn().mockRejectedValueOnce(new Error('cannot decode image'));
			transform.mockResolvedValueOnce(new File([new Uint8Array(10)], 'transformed.fit'));
			const { container } = render(Dropzone, {
				...defaultProps,
				transform,
				transformErrorMessage: 'Could not process this file.'
			});

			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			await userEvent.upload(input, new File([new Uint8Array(500)], 'broken.fit'));
			await expect.element(page.getByText('Could not process this file.')).toBeVisible();

			await userEvent.upload(input, new File([new Uint8Array(500)], 'activity.fit'));
			await expect.element(page.getByText('Could not process this file.')).not.toBeInTheDocument();
			await expect.element(page.getByText('transformed.fit')).toBeVisible();
		});
	});

	describe('locking', () => {
		test('ignores a second drop while a transform is still in flight', async () => {
			let resolveTransform: (f: File) => void = () => {};
			const pending = new Promise<File>((resolve) => {
				resolveTransform = resolve;
			});
			const transformed = new File([new Uint8Array(10)], 'transformed.fit');
			const transform = vi.fn().mockReturnValueOnce(pending);
			const { container } = render(Dropzone, { ...defaultProps, transform });

			dropFile(container, new File([new Uint8Array(500)], 'first.fit'));
			// Fired synchronously while the first transform is still pending -
			// must be ignored rather than racing the first selection.
			dropFile(container, new File([new Uint8Array(500)], 'second.fit'));

			resolveTransform(transformed);
			await expect.element(page.getByText('transformed.fit')).toBeVisible();

			expect(transform).toHaveBeenCalledOnce();
			expect(transform).toHaveBeenCalledWith(expect.objectContaining({ name: 'first.fit' }));
		});

		test('disables the input and ignores drops while disabled is true', async () => {
			const transform = vi.fn().mockResolvedValue(new File([new Uint8Array(10)], 'x.fit'));
			const { container } = render(Dropzone, { ...defaultProps, transform, disabled: true });

			const input = container.querySelector('input[type="file"]') as HTMLInputElement;
			expect(input.disabled).toBe(true);

			dropFile(container, new File([new Uint8Array(500)], 'activity.fit'));
			expect(transform).not.toHaveBeenCalled();
			await expect.element(page.getByText('Drop file here')).toBeVisible();
		});
	});
});
