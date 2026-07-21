import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		SMTP_HOST: 'smtp.example.com',
		SMTP_PORT: '587',
		SMTP_USER: 'user@example.com',
		SMTP_PASS: 'secret',
		SMTP_FROM: 'GritShot <noreply@example.com>'
	}
}));

const sendMail = vi.fn().mockResolvedValue({ messageId: 'abc123' });
vi.mock('nodemailer', () => ({
	default: { createTransport: vi.fn(() => ({ sendMail })) }
}));

vi.mock('$lib/server/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

import { sendCardMail } from './mailer';

describe('sendCardMail', () => {
	it('sends the image buffer as a jpeg attachment', async () => {
		const imageBuffer = Buffer.from('fake-jpeg-bytes');

		await sendCardMail('athlete@example.com', imageBuffer, 'Sunrise Run');

		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'athlete@example.com',
				attachments: [{ filename: 'gritshot.jpg', content: imageBuffer }]
			})
		);
	});
});
