export interface FitData {
	/** Total distance in km */
	distance: number;
	/** Active timer duration in seconds (pauses excluded) */
	durationAction: number;
	/** Total elapsed duration in seconds (pauses included) */
	durationTotal: number;
	/** Total elevation gain in meters */
	elevation: number;
}
