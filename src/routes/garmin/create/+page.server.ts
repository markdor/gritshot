import { fail, type Actions, type ServerLoad } from '@sveltejs/kit';
import { requireUser } from '$lib/server/authGuards';
import { hasGarminConnection, withGarminClient } from '$lib/server/garmin/client';
import {
	GarminAuthError,
	GarminNetworkError,
	GarminNotConnectedError
} from '$lib/server/garmin/errors';
import { downloadActivityZip } from '$lib/server/garmin/download';
import { renderCard } from '$lib/server/card/generate';
import { ZipProcessor } from '$lib/server/zip/process';
import { validateZip } from '$lib/server/zip/validate';
import { validateFit } from '$lib/server/fit/validate';
import { validateJpeg } from '$lib/server/jpg/validate';
import { FileValidationError } from '$lib/server/FileValidationError';
import { sendCardMail } from '$lib/server/mailer';
import { logger } from '$lib/server/logger';
import { m } from '$lib/paraglide/messages';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export type ActivityDTO = {
	activityId: number;
	name: string;
	type: string;
	startTimeLocal: string;
	distanceKm: number;
	durationSec: number;
	elevationM: number;
};

export const load: ServerLoad = async ({ locals }) => {
	const user = requireUser(locals);

	if (!hasGarminConnection(user.id)) {
		return { connected: false as const };
	}

	try {
		const activities = await withGarminClient(user.id, (c) => c.getActivities(0, 5));
		const dto: ActivityDTO[] = activities.map((a) => ({
			activityId: a.activityId,
			name: a.activityName,
			type: a.activityType?.typeKey ?? 'other',
			startTimeLocal: a.startTimeLocal,
			distanceKm: (a.distance ?? 0) / 1000,
			durationSec: a.duration ?? 0,
			elevationM: a.elevationGain ?? 0
		}));
		return { connected: true as const, activities: dto, error: null };
	} catch (err) {
		if (err instanceof GarminAuthError) {
			return {
				connected: true as const,
				activities: [] as ActivityDTO[],
				error: m.garmin_error_auth_session()
			};
		}
		logger.warn({ err, userId: user.id }, 'failed to load garmin activities');
		return {
			connected: true as const,
			activities: [] as ActivityDTO[],
			error: m.garmin_error_network()
		};
	}
};

export const actions: Actions = {
	// TODO: rate-limit garmin create per user (out of scope).
	default: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const title = String(formData.get('title') ?? '')
			.replace(/\p{Cc}/gu, '')
			.trim();
		const activityIdRaw = String(formData.get('activityId') ?? '');
		const photoFile = formData.get('photoFile');

		if (!title) return fail(422, { error: m.error_title_required() });
		if (title.length > 28) return fail(422, { error: m.error_title_too_long() });

		const activityId = Number(activityIdRaw);
		if (!Number.isInteger(activityId) || activityId <= 0) {
			return fail(422, { error: m.garmin_error_no_activity_selected() });
		}

		if (!(photoFile instanceof File) || photoFile.size === 0) {
			return fail(422, { error: m.error_no_photo() });
		}
		if (photoFile.size > MAX_UPLOAD_SIZE) {
			return fail(422, { error: m.error_file_too_large() });
		}

		try {
			const zipBuffer = await withGarminClient(user.id, (c) => downloadActivityZip(c, activityId));
			await validateZip(zipBuffer);
			const { content: fitBuffer } = await new ZipProcessor().extract(zipBuffer);
			validateFit(fitBuffer);

			const photoBuffer = Buffer.from(await photoFile.arrayBuffer());
			validateJpeg(photoBuffer);

			const image = await renderCard(fitBuffer, photoBuffer, title);

			if (formData.get('sendEmail') === 'on') {
				try {
					await sendCardMail(user.email, image, title);
				} catch (mailErr) {
					logger.error({ err: mailErr, userId: user.id }, 'failed to send garmin card email');
				}
			}

			return { image: image.toString('base64'), title };
		} catch (e) {
			if (e instanceof FileValidationError) {
				logger.error(`File validation error (garmin): ${e.message}`);
				return fail(422, { error: e.userMessage });
			}
			if (e instanceof GarminNotConnectedError) {
				return fail(422, { error: m.garmin_create_empty_subtitle() });
			}
			if (e instanceof GarminAuthError) {
				return fail(401, { error: m.garmin_error_auth_session() });
			}
			if (e instanceof GarminNetworkError) {
				return fail(502, { error: m.garmin_error_download_failed() });
			}
			logger.error(
				`Unexpected error during garmin card generation: ${e instanceof Error ? e.message : String(e)}`
			);
			return fail(500, { error: m.error_generate_failed() });
		}
	}
};
