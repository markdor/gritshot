import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';
import { logger } from './logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
	if (transporter) return transporter;

	const host = env.SMTP_HOST;
	const port = Number(env.SMTP_PORT ?? '587');
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;

	if (!host || !user || !pass) {
		throw new Error(
			'SMTP not configured: SMTP_HOST, SMTP_USER and SMTP_PASS are required to send mail'
		);
	}

	transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});
	return transporter;
}

export async function sendMagicLinkMail(email: string, url: string): Promise<void> {
	const from = env.SMTP_FROM ?? env.SMTP_USER;
	if (!from) {
		throw new Error('SMTP_FROM or SMTP_USER must be set as the sender address');
	}

	const info = await getTransporter().sendMail({
		from,
		to: email,
		subject: 'Your GritShot sign-in link',
		text: `Click the link below to sign in to GritShot. The link is valid for 24 hours and can be used once.\n\n${url}\n\nIf you did not request this, you can safely ignore this email.`,
		html: `<p>Click the link below to sign in to GritShot. The link is valid for 24 hours and can be used once.</p><p><a href="${url}">Sign in to GritShot</a></p><p>If you did not request this, you can safely ignore this email.</p>`
	});

	logger.info({ messageId: info.messageId, email }, 'magic link email sent');
}

export async function sendCardMail(
	email: string,
	imageBuffer: Buffer,
	title: string
): Promise<void> {
	const from = env.SMTP_FROM ?? env.SMTP_USER;
	if (!from) {
		throw new Error('SMTP_FROM or SMTP_USER must be set as the sender address');
	}

	const info = await getTransporter().sendMail({
		from,
		to: email,
		subject: 'Your GritShot is ready',
		text: `Your GritShot "${title}" is attached to this email.`,
		html: `<p>Your GritShot "${title}" is attached to this email.</p>`,
		attachments: [{ filename: 'gritshot.jpg', content: imageBuffer }]
	});

	logger.info({ messageId: info.messageId, email }, 'card email sent');
}
