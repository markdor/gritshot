export class GarminAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GarminAuthError';
	}
}

export class GarminNetworkError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'GarminNetworkError';
	}
}

export class GarminNotConnectedError extends Error {
	constructor() {
		super('user has no Garmin connection');
		this.name = 'GarminNotConnectedError';
	}
}
